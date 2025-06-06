import { OrgStorageRepository } from '@database'
import { BaseController, Controller, Get, Post, Put, UseMiddleware } from '../../core'
import { authMiddleware } from '../../middlewares'
import { AuthRequest } from '../../types'
import InternalServerException from '../../exceptions/InternalServerException'
import { OrgStorageType } from '@prisma/client'
import { IStorageAWSConfig } from '../../services/organizationStorage.service'
import { GB, MB, StorageService } from '../../services/storage.service'
import StorageCache from '../../caches/StorageCache'

@Controller('/org-storage')
@UseMiddleware([authMiddleware])
export class OrganizationStorageController extends BaseController {
  storageService: StorageService
  constructor() {
    super()
    // only use this service to validate aws config
    this.storageService = new StorageService('1')
  }
  @Get('')
  async getOrgStorageConfig() {
    const req = this.req as AuthRequest
    try {
      const { orgId } = req.query as { orgId: string }
      const orgRepo = new OrgStorageRepository()
      const data = await orgRepo.getAwsConfig(orgId)

      return data.config
    } catch (error) {
      throw new InternalServerException()
    }
  }

  @Put('')
  async updateOrgStorage() {
    const req = this.req as AuthRequest
    try {
      const { orgId, type, config } = req.body as {
        orgId: string
        type: OrgStorageType
        config: IStorageAWSConfig & { endpoint?: string }
      }

      console.log('storage configuration', req.body)

      const { id } = req.authen

      const { bucketName, region, secretKey, accessKey } = config
      let maxStorageSize = parseInt(config.maxStorageSize + "", 10)

      if (!bucketName || !region || !secretKey || !accessKey || !maxStorageSize) {
        throw new Error('Invalid storage configuration')
      }

      if (isNaN(maxStorageSize)) {
        throw new Error('Invalid value')
      }

      if (maxStorageSize !== -1) {
        maxStorageSize = maxStorageSize * GB
      } else {
        maxStorageSize = 999999 * GB
      }

      if (maxStorageSize < 100 * MB) {
        throw new Error('Storage size must be greater than or equal 1GB')
      }

      console.log('Start validating storage configuration')
      // Validate config based on storage type
      const valid = await this.storageService.validateConfig({
        type,
        config: {
          bucketName,
          region,
          secretKey,
          accessKey,
          endpoint: config.endpoint
        }
      })

      if (!valid) {
        throw new Error(`Invalid ${type} configuration`)
      }

      const orgRepo = new OrgStorageRepository()
      const result = await orgRepo.updateOrCreateAwsConfig(orgId, {
        organizationId: orgId,
        config: {
          bucketName,
          region,
          secretKey,
          accessKey,
          maxStorageSize,
          endpoint: config.endpoint
        },
        type,
        createdAt: new Date(),
        createdBy: id,
        updatedAt: null,
        updatedBy: null
      })

      StorageCache.deleteMaxStorageSize(orgId)

      return result
    } catch (error) {
      console.log('create or update org storage error', error)
      throw new Error(error)
    }
  }
}
