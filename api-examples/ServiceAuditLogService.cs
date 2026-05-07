using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HotelTourPortal.Api.Services
{
    public class ServiceAuditLogService : IServiceAuditLogService
    {
        private readonly IMongoCollection<ServiceAuditLog> _auditLogsCollection;
        private readonly ILogger<ServiceAuditLogService> _logger;

        public ServiceAuditLogService(IMongoDatabase database, ILogger<ServiceAuditLogService> logger)
        {
            _auditLogsCollection = database.GetCollection<ServiceAuditLog>("ServiceAuditLogs");
            _logger = logger;
        }

        /// <summary>
        /// Log a service change to the audit trail
        /// </summary>
        /// <param name="auditLog">The audit log entry</param>
        public async Task LogServiceChangeAsync(ServiceAuditLog auditLog)
        {
            try
            {
                // Ensure the log has required fields
                if (string.IsNullOrEmpty(auditLog.Id))
                {
                    auditLog.Id = Guid.NewGuid().ToString();
                }

                if (auditLog.ChangeDate == default(DateTime))
                {
                    auditLog.ChangeDate = DateTime.UtcNow;
                }

                if (auditLog.CreatedAt == default(DateTime))
                {
                    auditLog.CreatedAt = DateTime.UtcNow;
                }

                // Convert objects to JSON strings for storage
                if (auditLog.OldValue != null && !(auditLog.OldValue is string))
                {
                    auditLog.OldValue = System.Text.Json.JsonSerializer.Serialize(auditLog.OldValue);
                }

                if (auditLog.NewValue != null && !(auditLog.NewValue is string))
                {
                    auditLog.NewValue = System.Text.Json.JsonSerializer.Serialize(auditLog.NewValue);
                }

                await _auditLogsCollection.InsertOneAsync(auditLog);

                _logger.LogInformation($"Audit log created: {auditLog.Description} for service {auditLog.ServiceId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error logging service change for service {auditLog.ServiceId}");
                throw;
            }
        }

        /// <summary>
        /// Get paginated audit logs for a service with filtering
        /// </summary>
        /// <param name="filter">Filter criteria</param>
        /// <returns>Paginated audit logs</returns>
        public async Task<PagedResult<ServiceAuditLog>> GetServiceLogsAsync(ServiceLogFilterDto filter)
        {
            try
            {
                var filterBuilder = Builders<ServiceAuditLog>.Filter;
                var filters = new List<FilterDefinition<ServiceAuditLog>>();

                // Service ID filter (required)
                filters.Add(filterBuilder.Eq(x => x.ServiceId, filter.ServiceId));

                // Optional filters
                if (!string.IsNullOrEmpty(filter.UserId))
                {
                    filters.Add(filterBuilder.Eq(x => x.UserId, filter.UserId));
                }

                if (!string.IsNullOrEmpty(filter.ChangeType))
                {
                    filters.Add(filterBuilder.Eq(x => x.ChangeType, filter.ChangeType));
                }

                if (!string.IsNullOrEmpty(filter.Section))
                {
                    filters.Add(filterBuilder.Eq(x => x.Section, filter.Section));
                }

                if (filter.FromDate.HasValue)
                {
                    filters.Add(filterBuilder.Gte(x => x.ChangeDate, filter.FromDate.Value));
                }

                if (filter.ToDate.HasValue)
                {
                    filters.Add(filterBuilder.Lte(x => x.ChangeDate, filter.ToDate.Value));
                }

                var combinedFilter = filterBuilder.And(filters);

                // Get total count
                var totalCount = await _auditLogsCollection.CountDocumentsAsync(combinedFilter);

                // Get paginated results ordered by change date (most recent first)
                var items = await _auditLogsCollection
                    .Find(combinedFilter)
                    .Sort(Builders<ServiceAuditLog>.Sort.Descending(x => x.ChangeDate))
                    .Skip((filter.PageNumber - 1) * filter.PageSize)
                    .Limit(filter.PageSize)
                    .ToListAsync();

                return new PagedResult<ServiceAuditLog>
                {
                    Items = items,
                    TotalCount = (int)totalCount,
                    PageNumber = filter.PageNumber,
                    PageSize = filter.PageSize
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving audit logs for service {filter.ServiceId}");
                throw;
            }
        }

        /// <summary>
        /// Get audit log statistics for a service
        /// </summary>
        /// <param name="serviceId">Service ID</param>
        /// <returns>Statistics about the audit logs</returns>
        public async Task<AuditLogStatistics> GetAuditLogStatisticsAsync(string serviceId)
        {
            try
            {
                var filter = Builders<ServiceAuditLog>.Filter.Eq(x => x.ServiceId, serviceId);
                
                var logs = await _auditLogsCollection
                    .Find(filter)
                    .ToListAsync();

                if (!logs.Any())
                {
                    return new AuditLogStatistics
                    {
                        TotalChanges = 0,
                        UniqueUsers = 0,
                        LastChangeDate = null,
                        ChangesByType = new Dictionary<string, int>(),
                        ChangesBySection = new Dictionary<string, int>(),
                        TopChangedFields = new Dictionary<string, int>()
                    };
                }

                var statistics = new AuditLogStatistics
                {
                    TotalChanges = logs.Count,
                    UniqueUsers = logs.Select(x => x.UserId).Distinct().Count(),
                    LastChangeDate = logs.Max(x => x.ChangeDate),
                    ChangesByType = logs
                        .GroupBy(x => x.ChangeType)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    ChangesBySection = logs
                        .GroupBy(x => x.Section)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    TopChangedFields = logs
                        .Where(x => !string.IsNullOrEmpty(x.FieldName))
                        .GroupBy(x => x.FieldName)
                        .OrderByDescending(g => g.Count())
                        .Take(10)
                        .ToDictionary(g => g.Key, g => g.Count())
                };

                return statistics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving audit log statistics for service {serviceId}");
                throw;
            }
        }

        /// <summary>
        /// Clean up old audit logs based on retention policy
        /// </summary>
        /// <param name="retentionDays">Number of days to retain logs</param>
        /// <returns>Number of deleted logs</returns>
        public async Task<int> CleanupOldLogsAsync(int retentionDays = 365)
        {
            try
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);
                var filter = Builders<ServiceAuditLog>.Filter.Lt(x => x.CreatedAt, cutoffDate);
                
                var result = await _auditLogsCollection.DeleteManyAsync(filter);
                
                _logger.LogInformation($"Cleaned up {result.DeletedCount} old audit logs older than {cutoffDate}");
                
                return (int)result.DeletedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old audit logs");
                throw;
            }
        }

        /// <summary>
        /// Get audit logs for multiple services (useful for dashboard views)
        /// </summary>
        /// <param name="serviceIds">List of service IDs</param>
        /// <param name="limit">Maximum number of logs to return</param>
        /// <returns>Recent audit logs across multiple services</returns>
        public async Task<List<ServiceAuditLog>> GetRecentLogsForServicesAsync(List<string> serviceIds, int limit = 100)
        {
            try
            {
                var filter = Builders<ServiceAuditLog>.Filter.In(x => x.ServiceId, serviceIds);
                
                var logs = await _auditLogsCollection
                    .Find(filter)
                    .Sort(Builders<ServiceAuditLog>.Sort.Descending(x => x.ChangeDate))
                    .Limit(limit)
                    .ToListAsync();

                return logs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recent logs for multiple services");
                throw;
            }
        }

        /// <summary>
        /// Export audit logs to CSV format
        /// </summary>
        /// <param name="serviceId">Service ID</param>
        /// <param name="fromDate">Start date for export</param>
        /// <param name="toDate">End date for export</param>
        /// <returns>CSV content as string</returns>
        public async Task<string> ExportLogsAsCsvAsync(string serviceId, DateTime? fromDate = null, DateTime? toDate = null)
        {
            try
            {
                var filterBuilder = Builders<ServiceAuditLog>.Filter;
                var filters = new List<FilterDefinition<ServiceAuditLog>>
                {
                    filterBuilder.Eq(x => x.ServiceId, serviceId)
                };

                if (fromDate.HasValue)
                {
                    filters.Add(filterBuilder.Gte(x => x.ChangeDate, fromDate.Value));
                }

                if (toDate.HasValue)
                {
                    filters.Add(filterBuilder.Lte(x => x.ChangeDate, toDate.Value));
                }

                var combinedFilter = filterBuilder.And(filters);
                
                var logs = await _auditLogsCollection
                    .Find(combinedFilter)
                    .Sort(Builders<ServiceAuditLog>.Sort.Descending(x => x.ChangeDate))
                    .ToListAsync();

                var csv = "Date,User,Change Type,Section,Field,Old Value,New Value,Description\n";
                
                foreach (var log in logs)
                {
                    csv += $"\"{log.ChangeDate:yyyy-MM-dd HH:mm:ss}\",\"{log.UserName}\",\"{log.ChangeType}\",\"{log.Section}\",\"{log.FieldName}\",\"{EscapeCsvValue(log.OldValue)}\",\"{EscapeCsvValue(log.NewValue)}\",\"{EscapeCsvValue(log.Description)}\"\n";
                }

                return csv;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error exporting audit logs for service {serviceId}");
                throw;
            }
        }

        private string EscapeCsvValue(string value)
        {
            if (string.IsNullOrEmpty(value))
                return "";
            
            return value.Replace("\"", "\"\"");
        }
    }
}
