export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '回复小助手', navigationStyle: 'custom' })
  : { navigationBarTitleText: '回复小助手', navigationStyle: 'custom' }
