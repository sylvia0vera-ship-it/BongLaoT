export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '粉丝管理' })
  : { navigationBarTitleText: '粉丝管理' }
