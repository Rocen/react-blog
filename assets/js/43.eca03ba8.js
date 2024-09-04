(window.webpackJsonp=window.webpackJsonp||[]).push([[43],{461:function(a,t,s){"use strict";s.r(t);var e=s(16),r=Object(e.a)({},(function(){var a=this,t=a.$createElement,s=a._self._c||t;return s("ContentSlotsDistributor",{attrs:{"slot-key":a.$parent.slotKey}},[s("h2",{attrs:{id:"拉取源码"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#拉取源码"}},[a._v("#")]),a._v(" 拉取源码")]),a._v(" "),s("p",[a._v("因为"),s("code",[a._v("React")]),a._v("一直处于不断的更迭中，所以源码的内容一定也是在不断变化的。并且，因为"),s("code",[a._v("React")]),a._v("作为一款主流框架一定是会不断的发展。在这个发展的过程中也会不断推出新的功能，新功能的推出也就伴随着对源码内容的修改和增加。所以，在越高版本的"),s("code",[a._v("React")]),a._v("源码一定比相对低版本的"),s("code",[a._v("React")]),a._v("源码更复杂，也就更难以阅读和学习了。")]),a._v(" "),s("p",[a._v("本站讲解的源码对应的是"),s("em",[a._v("17.0.2")]),a._v("版本。")]),a._v(" "),s("p",[a._v("拉取"),s("code",[a._v("facebook/react")]),a._v("代码：")]),a._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[a._v("# 拉取代码\ngit clone https"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v(":")]),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("github"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(".")]),a._v("com"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("facebook"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("react"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(".")]),a._v("git\n\n# 如果拉取速度很慢，可以考虑如下"),s("span",{pre:!0,attrs:{class:"token number"}},[a._v("2")]),a._v("个方案：\n\n# "),s("span",{pre:!0,attrs:{class:"token number"}},[a._v("1.")]),a._v(" 使用cnpm代理\ngit clone https"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v(":")]),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("github"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(".")]),a._v("com"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(".")]),a._v("cnpmjs"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(".")]),a._v("org"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("facebook"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("react\n\n# "),s("span",{pre:!0,attrs:{class:"token number"}},[a._v("2.")]),a._v(" 使用码云的镜像（一天会与react同步一次）\ngit clone https"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v(":")]),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("gitee"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(".")]),a._v("com"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("mirrors"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("react"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(".")]),a._v("git\n")])])]),s("p",[a._v("安装依赖")]),a._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[a._v("# 切入到react源码所在文件夹\ncd react\n\n# 安装依赖\nyarn\n")])])]),s("p",[a._v("打包react、scheduler、react-dom三个包为dev环境可以使用的cjs包。")]),a._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[a._v("# 执行打包命令\nyarn build react"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("index"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(",")]),a._v("react"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("jsx"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(",")]),a._v("react"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("-")]),a._v("dom"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("index"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(",")]),a._v("scheduler "),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("--")]),a._v("type"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("=")]),s("span",{pre:!0,attrs:{class:"token constant"}},[a._v("NODE")]),a._v("\n")])])]),s("p",[a._v("现在源码目录build/node_modules下会生成最新代码的包。我们为react、react-dom创建yarn link。\n···tips\n通过yarn link可以改变项目中依赖包的目录指向\n···")]),a._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[a._v("cd build"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("node_modules"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("react\n# 申明react指向\nyarn link\ncd build"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("node_modules"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("/")]),a._v("react"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("-")]),a._v("dom\n# 申明react"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("-")]),a._v("dom指向\nyarn link\n")])])]),s("h2",{attrs:{id:"创建项目"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#创建项目"}},[a._v("#")]),a._v(" 创建项目")]),a._v(" "),s("hr"),a._v(" "),s("p",[a._v("接下来我们通过create-react-app在其他地方创建新项目。这里我们随意起名，比如“debug-react-demo”。")]),a._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[a._v("npx create"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("-")]),a._v("react"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("-")]),a._v("app a"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("-")]),a._v("react"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("-")]),a._v("demo\n")])])]),s("p",[a._v("在新项目中，将react与react-dom2个包指向facebook/react下我们刚才生成的包。")]),a._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[a._v("# 将项目内的react react"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("-")]),a._v("dom指向之前申明的包\nyarn link react react"),s("span",{pre:!0,attrs:{class:"token operator"}},[a._v("-")]),a._v("dom\n")])])]),s("p",[a._v("现在试试在react/build/node_modules/react-dom/cjs/react-dom.development.js中随意打印些东西。\n例如，可以在RaectDOMRoot.js文件中的createRoot函数中打印一句话：")]),a._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[a._v("console"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[a._v("log")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v("(")]),s("span",{pre:!0,attrs:{class:"token string"}},[a._v("'debug react sourse code....'")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(")")]),a._v("\n")])])]),s("p",[a._v("在debug-react-demo项目下执行yarn start。现在浏览器控制台已经可以打印出我们输入的东西了。")]),a._v(" "),s("p",[a._v("通过以上方法，我们的运行时代码就是可以调试的React代码了。")])])}),[],!1,null,null,null);t.default=r.exports}}]);