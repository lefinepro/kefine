export const VPN_FLOW_MOCK = {
  stepDelaysMs: [1200, 1700, 1900, 1600],
  labels: {
    scenario: 'VPN service runbook',
    current: 'Current phase',
    next: 'Up next',
    step: 'Step',
    of: 'of',
    timer: 'ETA',
    profile: 'Solver profile',
    copy: 'Workflow notes',
    executionEstimate: 'Execution window',
    price: 'Price',
    widget: 'Delivery widget'
  },
  steps: [
    {
      id: 'vpn-discovery',
      badge: 'Routing',
      title: 'Network requirements are analysed',
      detail:
        'Resolvers inspect regions, protocol support, and the target team footprint before selecting a route.',
      revealSolver: false,
      revealExecutionEstimate: false,
      revealPrice: false,
      revealWidget: false,
      solver: {
        name: 'Route Scout',
        handle: '@route-scout',
        profileUrl: 'https://solver.market/@route-scout'
      }
    },
    {
      id: 'vpn-pricing',
      badge: 'Quote',
      title: 'Solver quote is locked in',
      detail: 'The best route is chosen and the solver publishes the setup cost together with the execution window.',
      revealSolver: true,
      revealExecutionEstimate: true,
      revealPrice: true,
      revealWidget: false,
      solver: {
        name: 'Pricing Oracle',
        handle: '@pricing-oracle',
        profileUrl: 'https://solver.market/@pricing-oracle'
      }
    },
    {
      id: 'vpn-deploying',
      badge: 'Provisioning',
      title: 'Managed VPN endpoint is being prepared',
      detail: 'The winning solver provisions the selected region, injects the credentials, and seals the guest profile.',
      revealSolver: true,
      revealExecutionEstimate: true,
      revealPrice: true,
      revealWidget: false,
      solver: {
        name: 'Infra Forge',
        handle: '@infra-forge',
        profileUrl: 'https://solver.market/@infra-forge'
      }
    },
    {
      id: 'vpn-ready',
      badge: 'Solver',
      title: 'Access package is staged',
      detail: 'Unlock the solver result screen to reveal the connection package for your access mode.',
      revealSolver: true,
      revealExecutionEstimate: true,
      revealPrice: true,
      revealWidget: true,
      solver: {
        name: 'Delivery Relay',
        handle: '@delivery-relay',
        profileUrl: 'https://solver.market/@delivery-relay'
      },
      instructions: [
        {
          title: 'Guest route',
          detail: 'Use the temporary profile to test the endpoint for 10 minutes before committing funds.'
        },
        {
          title: 'Permanent route',
          detail: 'Complete payment to receive the durable configuration bundle and fallback credentials.'
        }
      ]
    }
  ],
  widget: {
    title: 'VPN delivery widget',
    summary: 'The solver package is ready to be opened after authentication and payment are confirmed.',
    badge: 'Delivery'
  }
} as const;
