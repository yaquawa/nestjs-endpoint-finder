import { Fzf } from 'fzf'
import type { EndpointInfo, MatchedEndpoint } from '../types'

export class FzfSearch {
  private fzf: Fzf<EndpointInfo[]>
  private endpoints: EndpointInfo[]

  constructor(endpoints: EndpointInfo[]) {
    console.log('🏗️ FzfSearch: Creating new instance with', endpoints.length, 'endpoints')
    this.endpoints = endpoints

    this.fzf = new Fzf(endpoints, {
      selector: (item: EndpointInfo) => item.fullPath,
      casing: 'case-insensitive',
    })

    console.log('✅ FZF instance created successfully')
  }

  search(query: string): MatchedEndpoint[] {
    console.log(`🔎 FzfSearch: Searching for "${query}"`)

    if (!query.trim()) {
      return this.endpoints.map(endpoint => ({
        endpoint: endpoint,
        matches: [],
      }))
    }

    const results = this.fzf.find(query)
    console.log(`🎯 FZF raw results:`, results.length)

    if (results.length === 0) {
      console.log(`❌ No matches found for "${query}"`)
      return []
    }

    // Convert FZF results to our format
    const convertedResults: MatchedEndpoint[] = results.map(
      (result: { item: EndpointInfo; score: number; positions: Set<number> | number[] }) => {
        let matches: Array<{ indices: Array<[number, number]>; value: string; key: string }> = []

        if (result.positions && typeof result.positions === 'object') {
          try {
            let positions
            if (Array.isArray(result.positions)) {
              positions = result.positions
            } else {
              positions = result.positions.size > 0 ? Array.from(result.positions) : []
            }

            if (positions.length > 0) {
              matches = [
                {
                  indices: positions.map(
                    (pos: number) => [Number(pos), Number(pos)] as [number, number]
                  ),
                  value: result.item?.fullPath || '',
                  key: 'fullPath',
                },
              ]
            }
          } catch (error) {
            console.warn('⚠️ Error processing FZF positions:', error)
          }
        }

        return {
          endpoint: result.item,
          matches,
        }
      }
    )

    console.log(`✨ Returning ${convertedResults.length} results with match information`)
    return convertedResults
  }

  updateEndpoints(endpoints: EndpointInfo[]): void {
    this.endpoints = endpoints
    this.fzf = new Fzf(endpoints, {
      selector: (item: EndpointInfo) => item.fullPath,
      casing: 'case-insensitive',
    })
    console.log('✅ FZF instance updated with', endpoints.length, 'endpoints')
  }
}
