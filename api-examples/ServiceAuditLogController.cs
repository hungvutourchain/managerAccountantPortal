using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HotelTourPortal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceAuditLogController : ControllerBase
    {
        private readonly ILogger<ServiceAuditLogController> _logger;
        private readonly IServiceAuditLogService _auditLogService;

        public ServiceAuditLogController(ILogger<ServiceAuditLogController> logger, IServiceAuditLogService auditLogService)
        {
            _logger = logger;
            _auditLogService = auditLogService;
        }

        /// <summary>
        /// Log a service change for audit purposes
        /// </summary>
        /// <param name="logData">The change log data</param>
        /// <returns>Success or error response</returns>
        [HttpPost("LogChange")]
        public async Task<IActionResult> LogChange([FromBody] ServiceChangeLogDto logData)
        {
            try
            {
                if (logData == null)
                {
                    return BadRequest("Log data is required");
                }

                // Validate required fields
                if (string.IsNullOrEmpty(logData.ServiceId) || 
                    string.IsNullOrEmpty(logData.UserId) || 
                    string.IsNullOrEmpty(logData.UserName))
                {
                    return BadRequest("ServiceId, UserId, and UserName are required");
                }

                // Create audit log entry
                var auditLog = new ServiceAuditLog
                {
                    Id = Guid.NewGuid().ToString(),
                    ServiceId = logData.ServiceId,
                    ServiceName = logData.ServiceName,
                    UserId = logData.UserId,
                    UserName = logData.UserName,
                    ChangeDate = logData.ChangeDate ?? DateTime.UtcNow,
                    ChangeType = logData.ChangeType,
                    Section = logData.Section,
                    FieldName = logData.FieldName,
                    OldValue = logData.OldValue,
                    NewValue = logData.NewValue,
                    Description = logData.Description,
                    PeriodId = logData.PeriodId,
                    Nation = logData.Nation,
                    CreatedAt = DateTime.UtcNow
                };

                await _auditLogService.LogServiceChangeAsync(auditLog);

                _logger.LogInformation($"Service change logged: {logData.Description} by {logData.UserName}");

                return Ok(new { success = true, message = "Change logged successfully", id = auditLog.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging service change");
                return StatusCode(500, new { success = false, message = "An error occurred while logging the change" });
            }
        }

        /// <summary>
        /// Get audit logs for a specific service with filtering and pagination
        /// </summary>
        /// <param name="filter">Filter criteria</param>
        /// <returns>Paginated list of audit logs</returns>
        [HttpPost("GetLogs")]
        public async Task<IActionResult> GetLogs([FromBody] ServiceLogFilterDto filter)
        {
            try
            {
                if (filter == null || string.IsNullOrEmpty(filter.ServiceId))
                {
                    return BadRequest("ServiceId is required");
                }

                var result = await _auditLogService.GetServiceLogsAsync(filter);

                return Ok(new
                {
                    success = true,
                    total = result.TotalCount,
                    items = result.Items.Select(log => new ServiceChangeLogDto
                    {
                        Id = log.Id,
                        ServiceId = log.ServiceId,
                        ServiceName = log.ServiceName,
                        UserId = log.UserId,
                        UserName = log.UserName,
                        ChangeDate = log.ChangeDate,
                        ChangeType = log.ChangeType,
                        Section = log.Section,
                        FieldName = log.FieldName,
                        OldValue = log.OldValue,
                        NewValue = log.NewValue,
                        Description = log.Description,
                        PeriodId = log.PeriodId,
                        Nation = log.Nation
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving service logs");
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving logs" });
            }
        }

        /// <summary>
        /// Get audit log statistics for a service
        /// </summary>
        /// <param name="serviceId">Service ID</param>
        /// <returns>Audit log statistics</returns>
        [HttpGet("GetStatistics/{serviceId}")]
        public async Task<IActionResult> GetStatistics(string serviceId)
        {
            try
            {
                if (string.IsNullOrEmpty(serviceId))
                {
                    return BadRequest("ServiceId is required");
                }

                var stats = await _auditLogService.GetAuditLogStatisticsAsync(serviceId);

                return Ok(new
                {
                    success = true,
                    statistics = new
                    {
                        totalChanges = stats.TotalChanges,
                        totalUsers = stats.UniqueUsers,
                        lastChangeDate = stats.LastChangeDate,
                        changesByType = stats.ChangesByType,
                        changesBySection = stats.ChangesBySection,
                        topChangedFields = stats.TopChangedFields
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit log statistics");
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving statistics" });
            }
        }
    }

    // DTOs for API communication
    public class ServiceChangeLogDto
    {
        public string Id { get; set; }
        public string ServiceId { get; set; }
        public string ServiceName { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public DateTime? ChangeDate { get; set; }
        public string ChangeType { get; set; } // UPDATE, CREATE, DELETE, PERIOD_ADD, etc.
        public string Section { get; set; } // GENERAL_INFO, PERIOD, PRICE_BAND, etc.
        public string FieldName { get; set; }
        public object OldValue { get; set; }
        public object NewValue { get; set; }
        public string Description { get; set; }
        public string PeriodId { get; set; }
        public string Nation { get; set; }
    }

    public class ServiceLogFilterDto
    {
        public string ServiceId { get; set; }
        public string UserId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string ChangeType { get; set; }
        public string Section { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    // Entity models
    public class ServiceAuditLog
    {
        public string Id { get; set; }
        public string ServiceId { get; set; }
        public string ServiceName { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public DateTime ChangeDate { get; set; }
        public string ChangeType { get; set; }
        public string Section { get; set; }
        public string FieldName { get; set; }
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public string Description { get; set; }
        public string PeriodId { get; set; }
        public string Nation { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PagedResult<T>
    {
        public List<T> Items { get; set; }
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }

    public class AuditLogStatistics
    {
        public int TotalChanges { get; set; }
        public int UniqueUsers { get; set; }
        public DateTime? LastChangeDate { get; set; }
        public Dictionary<string, int> ChangesByType { get; set; }
        public Dictionary<string, int> ChangesBySection { get; set; }
        public Dictionary<string, int> TopChangedFields { get; set; }
    }

    // Service interface
    public interface IServiceAuditLogService
    {
        Task LogServiceChangeAsync(ServiceAuditLog auditLog);
        Task<PagedResult<ServiceAuditLog>> GetServiceLogsAsync(ServiceLogFilterDto filter);
        Task<AuditLogStatistics> GetAuditLogStatisticsAsync(string serviceId);
    }
}
