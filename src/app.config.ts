export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/fans/index',
    'pages/login/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '回复小助手',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#C4A09A',
    selectedColor: '#D98C9A',
    backgroundColor: '#F8EDEB',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '分析',
        iconPath: './assets/tabbar/book-heart.png',
        selectedIconPath: './assets/tabbar/book-heart-active.png',
      },
      {
        pagePath: 'pages/fans/index',
        text: '粉丝',
        iconPath: './assets/tabbar/users.png',
        selectedIconPath: './assets/tabbar/users-active.png',
      }
    ]
  }
})
