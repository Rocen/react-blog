(window.webpackJsonp=window.webpackJsonp||[]).push([[29],{446:function(t,e,s){"use strict";s.r(e);var a=s(16),n=Object(a.a)({},(function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[s("h2",{attrs:{id:"react中的性能优化"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#react中的性能优化"}},[t._v("#")]),t._v(" React中的性能优化")]),t._v(" "),s("p",[s("code",[t._v("React")]),t._v("源码内部有一个名词"),s("code",[t._v("bailout")]),t._v("，指当"),s("code",[t._v("useState")]),t._v("更新的"),s("code",[t._v("state")]),t._v("与当前"),s("code",[t._v("state")]),t._v("一致时（通过"),s("code",[t._v("Object.is")]),t._v("比较），"),s("code",[t._v("React")]),t._v("则不会重新"),s("code",[t._v("render")]),t._v("该组件的子组件，而会复用前一次更新已经生成的"),s("code",[t._v("Fiber")]),t._v("节点。")]),t._v(" "),s("p",[s("strong",[t._v("注意")]),t._v("：当命中"),s("code",[t._v("bailout")]),t._v("后，该组件可能还是会"),s("code",[t._v("render")]),t._v("，但是它的子组件并不会重新"),s("code",[t._v("render")]),t._v("。")]),t._v(" "),s("p",[t._v("这是因为，大部分情况下，只有当前组件"),s("code",[t._v("render")]),t._v("时，"),s("code",[t._v("useState")]),t._v("才会执行，然后计算出新的"),s("code",[t._v("state")]),t._v("，进而与旧的"),s("code",[t._v("state")]),t._v("比较。这是针对子组件的性能优化手段。")]),t._v(" "),s("p",[t._v("React的工作流程可以简单概括为：")]),t._v(" "),s("ol",[s("li",[t._v("交互触发的状态更新")]),t._v(" "),s("li",[t._v("组件树进行render")])]),t._v(" "),s("p",[t._v("刚才说的"),s("code",[t._v("bailout")]),t._v("发生在步骤"),s("em",[t._v("2")]),t._v("：组件树开始"),s("code",[t._v("render")]),t._v("后，命中了"),s("code",[t._v("bailout")]),t._v("的逻辑后，子组件并不会进行"),s("code",[t._v("render")]),t._v("。")]),t._v(" "),s("p",[t._v("实际上，还有一种更前置的优化策略：当步骤"),s("em",[t._v("1")]),t._v("触发时，发现"),s("code",[t._v("state")]),t._v("并没有发生变化，则直接退出，不会进行后续的工作流程。")]),t._v(" "),s("p",[t._v("正常情况下，执行点击事件的同时触发更新，直到"),s("code",[t._v("render")]),t._v("组件，执行"),s("code",[t._v("useState")]),t._v("后计算出新的"),s("code",[t._v("state")]),t._v("，进而与旧的"),s("code",[t._v("state")]),t._v("比较，然后再判断是否命中"),s("code",[t._v("bailout")]),t._v("的逻辑。")]),t._v(" "),s("p",[t._v("当执行点击事件时，可以立即计算出新的"),s("code",[t._v("state")]),t._v("，并与旧的"),s("code",[t._v("state")]),t._v("比较，如果两者相等的话，则不会进行组件树的"),s("code",[t._v("render")]),t._v("。")]),t._v(" "),s("p",[t._v("这种将计算"),s("code",[t._v("state")]),t._v("的时机提前的策略称为"),s("code",[t._v("eagerState")]),t._v("（急切的"),s("code",[t._v("state")]),t._v("）。")]),t._v(" "),s("h2",{attrs:{id:"伴随的问题"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#伴随的问题"}},[t._v("#")]),t._v(" 伴随的问题")]),t._v(" "),s("p",[t._v("通过交互触发的状态更新，如果状态前后的值没有变化，则可以省略剩下的步骤，这个优化策略被称为"),s("code",[t._v("eagerState")]),t._v("。")]),t._v(" "),s("p",[t._v("组件"),s("code",[t._v("render")]),t._v("时，如果子孙组件节点没有状态变化，则可以跳过子孙组件的重新"),s("code",[t._v("render")]),t._v("，这个优化策略被称为"),s("code",[t._v("bailout")]),t._v("。")]),t._v(" "),s("p",[t._v("从描述上来看，"),s("code",[t._v("eagerState")]),t._v("的逻辑是比较简单，只需要比较更新前后的"),s("code",[t._v("state")]),t._v("是否相等就可以了。")]),t._v(" "),s("p",[t._v("但是实现上却很复杂。")]),t._v(" "),s("h2",{attrs:{id:"eagerstate的触发条件"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#eagerstate的触发条件"}},[t._v("#")]),t._v(" eagerState的触发条件")]),t._v(" "),s("p",[t._v("什么叫“急切”的状态？只有在组件"),s("code",[t._v("render")]),t._v("的时候才能获取到组件的最新状态，即通过组件"),s("code",[t._v("render")]),t._v("并执行"),s("code",[t._v("useState")]),t._v("，然后计算出新的"),s("code",[t._v("state")]),t._v("。")]),t._v(" "),s("p",[t._v("通常交互可能触发多个更新，这些多个更新将"),s("strong",[t._v("共同")]),t._v("决定新状态的值。同时，这些更新都拥有各自的"),s("em",[t._v("优先级")]),t._v("，所以在"),s("code",[t._v("render")]),t._v("前并不能确定哪些更新会参与到状态的计算中。所以，这种情况必须执行组件的"),s("code",[t._v("render")]),t._v("，"),s("code",[t._v("useState")]),t._v("必须经过执行才能知道新状态的值。")]),t._v(" "),s("p",[t._v("而"),s("code",[t._v("eagerState")]),t._v("的意义是在某种情况下，可以将这个计算的时机"),s("strong",[t._v("提前")]),t._v("，在组件"),s("code",[t._v("render")]),t._v("之前就可以计算出最新的状态。")]),t._v(" "),s("p",[t._v("这个情况是什么呢？当"),s("strong",[t._v("组件上不存更新")]),t._v("时。")]),t._v(" "),s("p",[t._v("当组件不存在更新的时候，即本次更新就是该组件的第一个更新。所以在只有一个更新的情况下是可以"),s("strong",[t._v("提前")]),t._v("确定最新的"),s("code",[t._v("state")]),t._v("。")]),t._v(" "),s("p",[t._v("所以"),s("code",[t._v("eagerState")]),t._v("的前提就是：当前组件不存在更新，那么首次触发更新的时候，就可以立即计算出最新"),s("code",[t._v("state")]),t._v("，然后与当前"),s("code",[t._v("state")]),t._v("比较。如果两者的值一致，则省略后续"),s("code",[t._v("render")]),t._v("的流程。")]),t._v(" "),s("p",[t._v("例子：")]),t._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("App")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),t._v("num"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" updateNum"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("useState")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n  console"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("log")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token string"}},[t._v('"App render"')]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" num"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n  "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),t._v("div onClick"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("updateNum")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v("\n      "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),t._v("Child "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),t._v("div"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\n"),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("Child")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  console"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("log")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token string"}},[t._v('"child render"')]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),t._v("span"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),t._v("child"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("/")]),t._v("span"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("p",[t._v("输出的结果：")]),t._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 挂载时输出")]),t._v("\nApp render "),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),t._v("\nchild render \n\n"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 第一次点击输出")]),t._v("\nApp render "),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),t._v("\nchild render\n\n"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 第二次点击输出")]),t._v("\nApp render "),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),t._v("\n\n"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 第三次点击及之后，什么也不会打印")]),t._v("\n\n")])])]),s("p",[t._v("第二次点击时，理论上前后"),s("code",[t._v("state")]),t._v("的值并没有变化，所以不应该执行组件的"),s("code",[t._v("render")]),t._v("。但是结果竟然会执行组件的"),s("code",[t._v("render")]),t._v("。")]),t._v(" "),s("p",[t._v("存在这种问题的原因是什么呢？")]),t._v(" "),s("p",[s("code",[t._v("eagerState")]),t._v("的前提是：当前组件不存在更新。但是具体到源码来说，是组件对应的"),s("code",[t._v("current fiber")]),t._v("与"),s("code",[t._v("workInProgress fiber")]),t._v("都不存在更新。")]),t._v(" "),s("p",[t._v("当第一次点击"),s("em",[t._v("div")]),t._v("时，打印：")]),t._v(" "),s("div",{staticClass:"language- extra-class"},[s("pre",{pre:!0,attrs:{class:"language-text"}},[s("code",[t._v("App render1\nchild render\n")])])]),s("p",[t._v("在"),s("code",[t._v("React")]),t._v("的工作流程中，会调用"),s("code",[t._v("markUpdateLaneFromFiberToRoot")]),t._v("方法为"),s("code",[t._v("current fiber")]),t._v("标记更新，即"),s("code",[t._v("fiber.lanes = 1")]),t._v("。")]),t._v(" "),s("p",[t._v("然后在"),s("code",[t._v("beginWork")]),t._v("方法中，会先复用"),s("code",[t._v("current fiber")]),t._v("的一些属性（包括"),s("code",[t._v("lanes")]),t._v("）来创建"),s("code",[t._v("App FC")]),t._v("对应的"),s("code",[t._v("workInProgress fiber")]),t._v("，所以创建出来的"),s("code",[t._v("workInProgress fiber.lanes = 1")]),t._v("。")]),t._v(" "),s("p",[t._v("然后调用"),s("code",[t._v("renderWithHooks")]),t._v("方法执行组件的渲染。")]),t._v(" "),s("p",[t._v("在"),s("code",[t._v("renderWithHooks")]),t._v("方法中，会先清除"),s("code",[t._v("workInProgress fiber")]),t._v("的"),s("code",[t._v("lanes")]),t._v("标记，即"),s("code",[t._v("workInProgress.lanes = NoLanes")]),t._v("，然后再调用"),s("code",[t._v("updateReducer")]),t._v("计算新的"),s("code",[t._v("state")]),t._v("。")]),t._v(" "),s("p",[t._v("完成渲染后会进行"),s("code",[t._v("fiber")]),t._v("树的切换，将构建好的"),s("code",[t._v("workInProgress fiber")]),t._v("与"),s("code",[t._v("current fiber")]),t._v("交换位置，即"),s("code",[t._v("workInProgress fiber")]),t._v("树变为"),s("code",[t._v("current fiber")]),t._v("树，"),s("code",[t._v("current fiber")]),t._v("树再变为"),s("code",[t._v("workInProgress fiber")]),t._v("树。")]),t._v(" "),s("p",[t._v("至此完成了一次状态更新，但是可以发现：在切换"),s("code",[t._v("fiber")]),t._v("树之前"),s("code",[t._v("current fiber")]),t._v("其实还存在更新标记（"),s("code",[t._v("lanes = 1")]),t._v("），因为在以上状态更新的过程中并没有清除"),s("code",[t._v("current fiber.lanes")]),t._v("的值。")]),t._v(" "),s("p",[t._v("所以，尽管"),s("code",[t._v("React")]),t._v("最终进行了"),s("code",[t._v("fiber")]),t._v("树的替换，但是更新后的"),s("code",[t._v("curren fiber")]),t._v("与"),s("code",[t._v("workInProgress fiber")]),t._v("依然会通过"),s("code",[t._v("alternate")]),t._v("属性进行连接。")]),t._v(" "),s("p",[t._v("以下是"),s("code",[t._v("eagerState")]),t._v("优化逻辑的代码：")]),t._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" dispatchAction"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),s("span",{pre:!0,attrs:{class:"token constant"}},[t._v("S")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token constant"}},[t._v("A")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n  fiber"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" Fiber"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  queue"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" UpdateQueue"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),s("span",{pre:!0,attrs:{class:"token constant"}},[t._v("S")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token constant"}},[t._v("A")]),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(">")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  action"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token constant"}},[t._v("A")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" alternate "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" fiber"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("alternate"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ...")]),t._v("\n\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n      fiber"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("lanes "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" NoLanes "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&&")]),t._v("\n      "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("alternate "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("||")]),t._v(" alternate"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("lanes "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" NoLanes"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("//...")]),t._v("\n\n        "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("is")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("eagerState"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" currentState"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n            "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n        "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("p",[t._v("从这段代码可以看到，进行"),s("code",[t._v("eagerState")]),t._v("逻辑判断的条件是"),s("code",[t._v("fiber.lanes === 0")]),t._v("，并且"),s("code",[t._v("alternate === null || alternate.lanes === 0")]),t._v("。而这个"),s("code",[t._v("fiber")]),t._v("指的是"),s("code",[t._v("workInProgress fiber")]),t._v("。")]),t._v(" "),s("p",[t._v("上面我们已经讲过了，在第一次点击触发的状态更新流程中，切换"),s("code",[t._v("fiber")]),t._v("树之前"),s("code",[t._v("current fiber")]),t._v("存在更新，"),s("code",[t._v("workInProgress fiber")]),t._v("不存在更新。")]),t._v(" "),s("p",[t._v("在切换"),s("code",[t._v("fiber")]),t._v("树之后，"),s("code",[t._v("current fiber")]),t._v("不存在更新，而"),s("code",[t._v("workInProgress fiber")]),t._v("存在更新。")]),t._v(" "),s("p",[t._v("然后在第二次点击调用"),s("code",[t._v("dispatchAction")]),t._v("方法时，这个"),s("code",[t._v("fiber")]),t._v("指的是当前的"),s("code",[t._v("workInProgress fiber")]),t._v("，它是存在存更新的。")]),t._v(" "),s("p",[t._v("所以，在进入"),s("code",[t._v("eagerState")]),t._v("条件判断时，虽然满足"),s("code",[t._v("alternate.lanes === 0")]),t._v("，但是不满足"),s("code",[t._v("fiber.lanes === null")]),t._v("，因此没有命中"),s("code",[t._v("eagerState")]),t._v("的优化策略，从而又开启了一次状态更新。")]),t._v(" "),s("p",[t._v("通过这次触发的状态更新流程，依然会通过"),s("code",[t._v("markUpdateLaneFromFiberToRoot")]),t._v("为"),s("code",[t._v("current fiber")]),t._v("和"),s("code",[t._v("workInProgress fiber")]),t._v("同时标记更新"),s("code",[t._v("lanes = 1")]),t._v("。")]),t._v(" "),s("p",[t._v("但与之前不同的是，这次更新中新旧"),s("code",[t._v("props")]),t._v("没有变化，所以会将更新标志位"),s("code",[t._v("didReceiveUpdate")]),t._v("置为"),s("em",[t._v("false")]),t._v("。")]),t._v(" "),s("p",[t._v("接着根据"),s("code",[t._v("workInProgress.tag")]),t._v("等于"),s("code",[t._v("FunctionComponent")]),t._v("而调用"),s("code",[t._v("updateFunctionComponent")]),t._v("方法。在"),s("code",[t._v("updateFunctionComponent")]),t._v("方法内部，会调用"),s("code",[t._v("renderWithHooks")]),t._v("方法执行组件的渲染，然后会进行如下的判断：")]),t._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("current "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("!==")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&&")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("!")]),t._v("didReceiveUpdate"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("bailoutHooks")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("current"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" workInProgress"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" renderLanes"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("bailoutOnAlreadyFinishedWork")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("current"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" workInProgress"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" renderLanes"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("p",[t._v("因为本次属于"),s("code",[t._v("update")]),t._v("，所以"),s("code",[t._v("current")]),t._v("是存在的。并且"),s("code",[t._v("didReceiveUpdate")]),t._v("已经为"),s("code",[t._v("false")]),t._v("了，可以满足上述判断条件。")]),t._v(" "),s("p",[t._v("接着调用"),s("code",[t._v("bailoutHooks")]),t._v("方法：")]),t._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("bailoutHooks")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token parameter"}},[t._v("current"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" Fiber"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  workInProgress"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" Fiber"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  lanes"),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" Lanes"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")])]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 复用current fiber的updateQueue属性")]),t._v("\n  workInProgress"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("updateQueue "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" current"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("updateQueue"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 赋值effect")]),t._v("\n  workInProgress"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("flags "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("~")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("PassiveEffect "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("|")]),t._v(" UpdateEffect"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 移除current fiber.lanes属性中包含的lanes值")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// removeLanes = current.lanes & ~lanes")]),t._v("\n  current"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("lanes "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("removeLanes")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("current"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("lanes"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" lanes"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("p",[t._v("可以看到在调用了"),s("code",[t._v("bailoutHooks")]),t._v("方法后，会清除掉"),s("code",[t._v("current fiber.lanes")]),t._v("属性上包含的"),s("code",[t._v("lanes")]),t._v("值。因为当前"),s("code",[t._v("current fiber.lanes = 1")]),t._v("，在执行"),s("code",[t._v("removeLanes")]),t._v("方法后，"),s("code",[t._v("current fiber.lanes = 0")]),t._v("。")]),t._v(" "),s("p",[t._v("在执行完"),s("code",[t._v("bailoutHooks")]),t._v("方法后，会调用"),s("code",[t._v("bailoutOnAlreadyFinishedWork")]),t._v("方法复用"),s("code",[t._v("current fiber")]),t._v("来创建"),s("code",[t._v("workInProgress fiber")]),t._v("。")]),t._v(" "),s("p",[t._v("最后，"),s("code",[t._v("commit")]),t._v("阶段会切换"),s("code",[t._v("fiber")]),t._v("树，"),s("code",[t._v("current fiber")]),t._v("树变为"),s("code",[t._v("workInProgress fiber")]),t._v("树，"),s("code",[t._v("workInProgress fiber")]),t._v("树变为"),s("code",[t._v("current fiber")]),t._v("树。")]),t._v(" "),s("p",[t._v("再到第三次点击调用"),s("code",[t._v("dispatchAction")]),t._v("方法时，"),s("code",[t._v("fiber")]),t._v("对应的"),s("code",[t._v("workInProgress fiber")]),t._v("不存在更新。"),s("code",[t._v("alternate")]),t._v("对应的"),s("code",[t._v("current fiber")]),t._v("也不存在更新，所以此次执行会命中"),s("code",[t._v("eagerState")]),t._v("的优化策略，不会开启状态更新，从而达到性能优化的目的。")]),t._v(" "),s("h2",{attrs:{id:"总结"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[t._v("#")]),t._v(" 总结")]),t._v(" "),s("p",[t._v("综上所述，"),s("code",[t._v("React")]),t._v("性能优化并没有做到极致，因为存在两个相关联的"),s("code",[t._v("fiber")]),t._v("节点，并且也没有对"),s("code",[t._v("current fiber")]),t._v("上的更新标记及时的进行清除，导致在"),s("code",[t._v("fiber")]),t._v("树的切换后"),s("code",[t._v("workInProgress fiber")]),t._v("上总是存在更新标记。")]),t._v(" "),s("p",[t._v("由此可见，"),s("code",[t._v("eagerState")]),t._v("的优化策略并没有达到"),s("em",[t._v("最")]),t._v("理想的状态。")])])}),[],!1,null,null,null);e.default=n.exports}}]);