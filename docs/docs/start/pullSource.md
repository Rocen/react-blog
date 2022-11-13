## 拉取源码
因为`React`一直处于不断的更迭中，所以源码的内容一定也是在不断变化的。并且，因为`React`作为一款主流框架一定是会不断的发展。在这个发展的过程中也会不断推出新的功能，新功能的推出也就伴随着对源码内容的修改和增加。所以，在越高版本的`React`源码一定比相对低版本的`React`源码更复杂，也就更难以阅读和学习了。  

本站讲解的源码对应的是*17.0.2*版本。

拉取`facebook/react`代码：
```js
# 拉取代码
git clone https://github.com/facebook/react.git

# 如果拉取速度很慢，可以考虑如下2个方案：

# 1. 使用cnpm代理
git clone https://github.com.cnpmjs.org/facebook/react

# 2. 使用码云的镜像（一天会与react同步一次）
git clone https://gitee.com/mirrors/react.git
```
安装依赖
```js
# 切入到react源码所在文件夹
cd react

# 安装依赖
yarn
```
打包react、scheduler、react-dom三个包为dev环境可以使用的cjs包。
```js
# 执行打包命令
yarn build react/index,react/jsx,react-dom/index,scheduler --type=NODE
```
现在源码目录build/node_modules下会生成最新代码的包。我们为react、react-dom创建yarn link。
···tips
通过yarn link可以改变项目中依赖包的目录指向
···
```js
cd build/node_modules/react
# 申明react指向
yarn link
cd build/node_modules/react-dom
# 申明react-dom指向
yarn link
```
## 创建项目
---
接下来我们通过create-react-app在其他地方创建新项目。这里我们随意起名，比如“debug-react-demo”。
```js
npx create-react-app a-react-demo
```
在新项目中，将react与react-dom2个包指向facebook/react下我们刚才生成的包。
```js
# 将项目内的react react-dom指向之前申明的包
yarn link react react-dom
```
现在试试在react/build/node_modules/react-dom/cjs/react-dom.development.js中随意打印些东西。
例如，可以在RaectDOMRoot.js文件中的createRoot函数中打印一句话：
```js
console.log('debug react sourse code....')
```
在debug-react-demo项目下执行yarn start。现在浏览器控制台已经可以打印出我们输入的东西了。

通过以上方法，我们的运行时代码就是可以调试的React代码了。