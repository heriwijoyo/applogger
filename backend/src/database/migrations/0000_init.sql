CREATE TABLE `service_performance_log` (
    `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    `trace_id` TEXT NOT NULL,
    `action` TEXT NOT NULL,
    `start_time_ms` INTEGER NOT NULL,
    `end_time_ms` INTEGER NOT NULL,
    `success` INTEGER NOT NULL,
    `result_code` TEXT NOT NULL,
    `creation_time_ms` INTEGER NOT NULL
);

CREATE INDEX idx_service_performance_log_trace_id ON `service_performance_log` (`trace_id`);