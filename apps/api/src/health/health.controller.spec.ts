import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';

// Mock the entire 'pg' module so no real DB connection is ever attempted
jest.mock('pg', () => {
  return {
    Client: jest.fn(),
  };
});

import { Client } from 'pg';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let httpHealthIndicator: HttpHealthIndicator;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        MINIO_ENDPOINT: 'http://localhost:9000/minio/health/live',
        POSTGRES_HOST: 'localhost',
      };
      return values[key];
    }),
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        POSTGRES_PORT: '5432',
        POSTGRES_USER: 'testuser',
        POSTGRES_PASSWORD: 'testpassword',
        POSTGRES_DB: 'testdb',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(),
          },
        },
        {
          provide: HttpHealthIndicator,
          useValue: {
            pingCheck: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    httpHealthIndicator = module.get<HttpHealthIndicator>(HttpHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkLiveness', () => {
    it('should call health.check with an empty array', async () => {
      const mockResult = { status: 'ok', info: {}, error: {}, details: {} };
      (healthCheckService.check as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.checkLiveness();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(healthCheckService.check).toHaveBeenCalledWith([]);
      expect(result).toEqual(mockResult);
    });
  });

  describe('checkReadiness', () => {
    it('should call health.check with postgres and minio indicator functions', async () => {
      const mockResult = {
        status: 'ok',
        info: { postgres: { status: 'up' }, minio: { status: 'up' } },
        error: {},
        details: {},
      };
      (healthCheckService.check as jest.Mock).mockImplementation(
        async (indicators: Array<() => Promise<any>>) => {
          // execute the indicator functions so we exercise checkPostgres/pingCheck too
          for (const indicator of indicators) {
            await indicator();
          }
          return mockResult;
        },
      );
      (httpHealthIndicator.pingCheck as jest.Mock).mockResolvedValue({
        minio: { status: 'up' },
      });

      // mock a successful Postgres connection for this test
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      const mockQuery = jest.fn().mockResolvedValue(undefined);
      const mockEnd = jest.fn().mockResolvedValue(undefined);
      (Client as unknown as jest.Mock).mockImplementation(() => ({
        connect: mockConnect,
        query: mockQuery,
        end: mockEnd,
      }));

      const result = await controller.checkReadiness();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(httpHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'minio',
        'http://localhost:9000/minio/health/live',
      );
      expect(mockConnect).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledWith('SELECT 1');
      expect(mockEnd).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('checkPostgres (private, via checkReadiness)', () => {
    it('should return status up when connection and query succeed', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      const mockQuery = jest.fn().mockResolvedValue(undefined);
      const mockEnd = jest.fn().mockResolvedValue(undefined);
      (Client as unknown as jest.Mock).mockImplementation(() => ({
        connect: mockConnect,
        query: mockQuery,
        end: mockEnd,
      }));

      (healthCheckService.check as jest.Mock).mockImplementation(
        async (indicators: Array<() => Promise<any>>) => {
          const results = await Promise.all(indicators.map((fn) => fn()));
          return { status: 'ok', results };
        },
      );
      (httpHealthIndicator.pingCheck as jest.Mock).mockResolvedValue({
        minio: { status: 'up' },
      });

      const result: any = await controller.checkReadiness();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.results[0]).toEqual({ postgres: { status: 'up' } });
    });

    it('should throw an error when the Postgres connection fails', async () => {
      const mockConnect = jest
        .fn()
        .mockRejectedValue(new Error('connection refused'));
      const mockEnd = jest.fn().mockResolvedValue(undefined);
      (Client as unknown as jest.Mock).mockImplementation(() => ({
        connect: mockConnect,
        query: jest.fn(),
        end: mockEnd,
      }));

      (healthCheckService.check as jest.Mock).mockImplementation(
        async (indicators: Array<() => Promise<any>>) => {
          // only invoke the postgres indicator (index 0) for this test
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return indicators[0]();
        },
      );

      await expect(controller.checkReadiness()).rejects.toThrow(
        'Postgres check failed: connection refused',
      );
      expect(mockEnd).toHaveBeenCalled();
    });
  });
});
