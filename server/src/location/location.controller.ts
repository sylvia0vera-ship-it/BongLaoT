import { Controller, Post, Body } from '@nestjs/common'
import { LocationService } from './location.service'

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('search')
  async search(@Body() body: { query: string }) {
    console.log('[LocationController] 搜索地点:', body.query)
    const result = await this.locationService.search(body.query || '')
    return { code: 200, msg: 'success', data: result }
  }
}
