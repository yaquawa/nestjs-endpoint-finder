import type {
  MatchedEndpoint,
  GroupedEndpointResult,
  SearchResult,
  ViewState,
  ControllerInfo,
} from '../types'

export class GroupingEngine {
  private viewState: ViewState = {
    displayMode: 'flat',
    expandedControllers: [],
    focusedController: undefined,
    searchQuery: '',
  }

  private autoExpandedControllers: Set<string> = new Set()
  private userCollapsedControllers: Set<string> = new Set()

  constructor(private controllers: ControllerInfo[]) {}

  updateControllers(controllers: ControllerInfo[]): void {
    this.controllers = controllers
  }

  updateViewState(updates: Partial<ViewState>): ViewState {
    this.viewState = {
      ...this.viewState,
      ...updates,
    }
    return this.viewState
  }

  getViewState(): ViewState {
    return { ...this.viewState }
  }

  toggleDisplayMode(): ViewState {
    const newMode = this.viewState.displayMode === 'flat' ? 'grouped' : 'flat'
    return this.updateViewState({ displayMode: newMode })
  }

  toggleControllerExpansion(controllerName: string): ViewState {
    // Track user manual collapses (default is expanded)
    if (this.userCollapsedControllers.has(controllerName)) {
      this.userCollapsedControllers.delete(controllerName)
    } else {
      this.userCollapsedControllers.add(controllerName)
    }

    // Remove from auto-expanded if user manually toggles
    this.autoExpandedControllers.delete(controllerName)

    // Create expanded controllers list (all controllers except user-collapsed ones)
    const allControllerNames = this.controllers.map(c => c.name)
    const expandedControllers = allControllerNames.filter(name => 
      !this.userCollapsedControllers.has(name)
    )

    const newState = this.updateViewState({
      expandedControllers,
      focusedController: !this.userCollapsedControllers.has(controllerName)
        ? controllerName
        : undefined,
    })
    console.log('👤 User collapsed:', Array.from(this.userCollapsedControllers))
    console.log('🤖 Auto expanded:', Array.from(this.autoExpandedControllers))
    return newState
  }

  private calculateMatchScore(endpoints: MatchedEndpoint[]): number {
    if (endpoints.length === 0) return 0

    return (
      endpoints.reduce((total, matchedEndpoint) => {
        const matchCount = matchedEndpoint.matches.reduce(
          (count, match) => count + match.indices.length,
          0
        )
        return total + matchCount
      }, 0) / endpoints.length
    )
  }

  private shouldAutoExpand(
    controllerName: string,
    searchQuery: string,
    matchScore: number
  ): boolean {
    if (!searchQuery.trim()) return false

    // Auto-expand if controller name contains search query
    if (controllerName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return true
    }

    // Auto-expand if match score is high (indicating good matches within endpoints)
    return matchScore > 2
  }

  createSearchResult(matchedEndpoints: MatchedEndpoint[], searchQuery: string): SearchResult {
    // Don't automatically update searchQuery in viewState to avoid conflicts with user input

    // Group endpoints by controller
    const controllerGroups = new Map<string, MatchedEndpoint[]>()

    for (const matchedEndpoint of matchedEndpoints) {
      const controllerName = matchedEndpoint.endpoint.controllerName
      if (!controllerGroups.has(controllerName)) {
        controllerGroups.set(controllerName, [])
      }
      controllerGroups.get(controllerName)!.push(matchedEndpoint)
    }

    // Create grouped results
    const grouped: GroupedEndpointResult[] = []

    for (const controller of this.controllers) {
      const endpoints = controllerGroups.get(controller.name) || []
      if (endpoints.length === 0 && searchQuery.trim()) {
        // Skip controllers with no matches when searching
        continue
      }

      const matchScore = this.calculateMatchScore(endpoints)

      // Temporarily disable auto-expand logic for debugging
      // TODO: Re-enable after fixing basic toggle functionality
      /*
      if (searchQuery.trim() && 
          this.shouldAutoExpand(controller.name, searchQuery, matchScore) &&
          !this.userExpandedControllers.has(controller.name)) {
        this.autoExpandedControllers.add(controller.name)
      } else if (!searchQuery.trim()) {
        // Clear auto-expansions when search is cleared
        this.autoExpandedControllers.delete(controller.name)
      }
      */

      // Default expand all controllers, only collapse if user explicitly collapsed it
      const isExpanded = !this.userCollapsedControllers.has(controller.name)

      grouped.push({
        controllerName: controller.name,
        basePath: controller.basePath,
        filePath: controller.filePath,
        endpoints,
        totalEndpoints: controller.endpoints.length,
        isExpanded,
        matchScore,
      })
    }

    // Sort grouped results by match score (highest first) when searching
    if (searchQuery.trim()) {
      grouped.sort((a, b) => {
        // Prioritize controllers with matches
        if (a.endpoints.length > 0 && b.endpoints.length === 0) return -1
        if (a.endpoints.length === 0 && b.endpoints.length > 0) return 1

        // Then by match score
        return b.matchScore - a.matchScore
      })
    }

    // Update viewState with current expanded controllers (all except user-collapsed)
    const allControllerNames = this.controllers.map(c => c.name)
    const expandedControllers = allControllerNames.filter(name => 
      !this.userCollapsedControllers.has(name)
    )
    this.updateViewState({
      expandedControllers,
    })

    return {
      grouped,
      flat: matchedEndpoints,
      displayMode: this.viewState.displayMode,
      totalMatches: matchedEndpoints.length,
      totalEndpoints: this.controllers.reduce((total, ctrl) => total + ctrl.endpoints.length, 0),
    }
  }

  createInitialResult(): SearchResult {
    // Create initial grouped view with all controllers
    const grouped: GroupedEndpointResult[] = this.controllers.map(controller => ({
      controllerName: controller.name,
      basePath: controller.basePath,
      filePath: controller.filePath,
      endpoints: controller.endpoints.map(endpoint => ({
        endpoint,
        matches: [],
      })),
      totalEndpoints: controller.endpoints.length,
      isExpanded: !this.userCollapsedControllers.has(controller.name),
      matchScore: 0,
    }))

    const allEndpoints = this.controllers.flatMap(controller =>
      controller.endpoints.map(endpoint => ({
        endpoint,
        matches: [],
      }))
    )

    // Update viewState with current expanded controllers (all except user-collapsed)
    const allControllerNames = this.controllers.map(c => c.name)
    const expandedControllers = allControllerNames.filter(name => 
      !this.userCollapsedControllers.has(name)
    )
    this.updateViewState({
      expandedControllers,
    })

    return {
      grouped,
      flat: allEndpoints,
      displayMode: this.viewState.displayMode,
      totalMatches: allEndpoints.length,
      totalEndpoints: allEndpoints.length,
    }
  }
}
