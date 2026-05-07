using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;

namespace HotelTourPortal.Api.Configuration
{
    public static class ServiceCollectionExtensions
    {
        /// <summary>
        /// Configure audit logging services
        /// </summary>
        /// <param name="services">Service collection</param>
        /// <param name="configuration">Configuration</param>
        /// <returns>Service collection for chaining</returns>
        public static IServiceCollection AddAuditLogging(this IServiceCollection services, IConfiguration configuration)
        {
            // Register MongoDB database
            services.AddSingleton<IMongoDatabase>(provider =>
            {
                var connectionString = configuration.GetConnectionString("MongoDB");
                var client = new MongoClient(connectionString);
                var databaseName = configuration.GetValue<string>("DatabaseSettings:DatabaseName");
                return client.GetDatabase(databaseName);
            });

            // Register audit log service
            services.AddScoped<IServiceAuditLogService, ServiceAuditLogService>();

            // Register background service for cleanup (optional)
            services.AddHostedService<AuditLogCleanupService>();

            return services;
        }
    }

    /// <summary>
    /// Background service to periodically clean up old audit logs
    /// </summary>
    public class AuditLogCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AuditLogCleanupService> _logger;
        private readonly IConfiguration _configuration;

        public AuditLogCleanupService(
            IServiceScopeFactory scopeFactory, 
            ILogger<AuditLogCleanupService> logger,
            IConfiguration configuration)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PerformCleanup();
                    
                    // Run cleanup daily
                    await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during audit log cleanup");
                    
                    // Wait an hour before retrying if there's an error
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task PerformCleanup()
        {
            using var scope = _scopeFactory.CreateScope();
            var auditLogService = scope.ServiceProvider.GetRequiredService<IServiceAuditLogService>();
            
            var retentionDays = _configuration.GetValue<int>("AuditLog:RetentionDays", 365);
            
            var deletedCount = await auditLogService.CleanupOldLogsAsync(retentionDays);
            
            if (deletedCount > 0)
            {
                _logger.LogInformation($"Cleaned up {deletedCount} old audit logs");
            }
        }
    }
}
