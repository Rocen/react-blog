(window.webpackJsonp=window.webpackJsonp||[]).push([[24],{436:function(s,t,a){"use strict";a.r(t);var e=a(16),n=Object(e.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h2",{attrs:{id:"lane模型"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#lane模型"}},[s._v("#")]),s._v(" Lane模型")]),s._v(" "),a("p",[s._v("在"),a("code",[s._v("Schduler")]),s._v("架构篇中介绍了"),a("code",[s._v("Scheduler")]),s._v("中存在优先级的概念。而在"),a("code",[s._v("React")]),s._v("中，也存在优先级。这两类优先级虽然有关联，但是并不能混合使用。")]),s._v(" "),a("p",[s._v("当开启"),a("code",[s._v("Concurrent Mode")]),s._v("时，可能存在多种任务：")]),s._v(" "),a("ul",[a("li",[s._v("过期任务或同步任务使用同步优先级")]),s._v(" "),a("li",[s._v("用户交互产生的更新（点击事件或文本输入）使用高优先级")]),s._v(" "),a("li",[s._v("网络请求产生的更新使用普通优先级")]),s._v(" "),a("li",[a("code",[s._v("Suspense")]),s._v("会使用低优先级")])]),s._v(" "),a("p",[s._v("所以，为了应对存在多种优先级任务的情况，"),a("code",[s._v("React")]),s._v("需要涉及一套优先级机制：")]),s._v(" "),a("ul",[a("li",[s._v("可以表示优先级的不同")]),s._v(" "),a("li",[s._v("可能同时存在几个相同优先级的更新，即批次的概念")]),s._v(" "),a("li",[s._v("方便进行优先级的相关计算")])]),s._v(" "),a("p",[s._v("为了满足如上需求，"),a("code",[s._v("React")]),s._v("设计了"),a("code",[s._v("lane")]),s._v("模型。")]),s._v(" "),a("h2",{attrs:{id:"优先级"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#优先级"}},[s._v("#")]),s._v(" 优先级")]),s._v(" "),a("p",[a("code",[s._v("lane")]),s._v("使用"),a("em",[s._v("32")]),s._v("位二进制来表示，位数越小的"),a("code",[s._v("lane")]),s._v("表示优先级越高，位数越大的"),a("code",[s._v("lane")]),s._v("表示优先级越低。\n如代码所示：")]),s._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" NoLanes"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                        */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000000000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" NoLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lane "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                          */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000000000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" SyncLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lane "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                        */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000000000000001")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" SyncBatchedLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lane "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                 */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000000000000010")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" InputDiscreteHydrationLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lane "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*      */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000000000000100")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" InputDiscreteLanes"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                    */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000000000011000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" InputContinuousHydrationLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lane "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*           */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000000000100000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" InputContinuousLanes"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                  */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000000011000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" DefaultHydrationLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lane "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*            */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000000100000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" DefaultLanes"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                   */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000111000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" TransitionHydrationLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lane "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000001000000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" TransitionLanes"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                       */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000001111111110000000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" RetryLanes"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                            */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000011110000000000000000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" SomeRetryLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                  */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000010000000000000000000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" SelectiveHydrationLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lane "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*          */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000100000000000000000000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" NonIdleLanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                                 */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000111111111111111111111111111")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" IdleHydrationLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lane "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*               */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0001000000000000000000000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" IdleLanes"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                             */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0110000000000000000000000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" OffscreenLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lane "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                   */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b1000000000000000000000000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n")])])]),a("p",[s._v("其中，同步优先级占用的是第一位：")]),s._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" SyncLane"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lane "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                        */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000000000000001")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n")])])]),a("p",[s._v("从"),a("code",[s._v("SyncLane")]),s._v("往下一直到"),a("code",[s._v("SelectiveHydrationLane")]),s._v("，优先级逐步降低。")]),s._v(" "),a("h2",{attrs:{id:"批次"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#批次"}},[s._v("#")]),s._v(" 批次")]),s._v(" "),a("p",[s._v("以上这些"),a("code",[s._v("lane")]),s._v("的定义中存在多位值，比如：")]),s._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" InputDiscreteLanes"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                    */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000000000011000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" DefaultLanes"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                   */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000000000000000111000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" TransitionLanes"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/*                       */")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0b0000000001111111110000000000000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n")])])]),a("p",[s._v("这就是批次的概念，被称作"),a("code",[s._v("lanes")]),s._v("。"),a("br"),s._v("\n其中"),a("code",[s._v("InputDiscreteLanes")]),s._v("是“用户交互”触发更新会拥有的优先级范围。"),a("br"),s._v(" "),a("code",[s._v("DefaultLanes")]),s._v("是“请求数据返回后触发更新”拥有的优先级范围。"),a("br"),s._v(" "),a("code",[s._v("TransitionLanes")]),s._v("是"),a("code",[s._v("Suspense")]),s._v("、"),a("code",[s._v("useTransition")]),s._v("、"),a("code",[s._v("useDeferredValue")]),s._v("拥有的优先级范围。"),a("br"),s._v("\n这其中有个细节，越低优先级的"),a("code",[s._v("lanes")]),s._v("占用的位越多。比如"),a("code",[s._v("InputDiscreteLanes")]),s._v("占了"),a("em",[s._v("2")]),s._v("个位，"),a("code",[s._v("TransitionLanes")]),s._v("占了"),a("em",[s._v("9")]),s._v("个位。"),a("br"),s._v("\n原因在于：越低优先级的更新越容易被打断，导致被打断的任务会积压下来，所以需要更多的位来保存这些被打断的任务。相反，最高优的同步更新的"),a("code",[s._v("SyncLane")]),s._v("不需要多余的"),a("code",[s._v("lanes")]),s._v("，它会最早执行。")]),s._v(" "),a("h2",{attrs:{id:"优先级计算"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#优先级计算"}},[s._v("#")]),s._v(" 优先级计算")]),s._v(" "),a("p",[s._v("既然"),a("code",[s._v("lane")]),s._v("对应了二进制的位，那么优先级相关计算采用就是位运算。比如：\n"),a("em",[s._v("a")]),s._v("和"),a("em",[s._v("b")]),s._v("是否存在交集，只需要判断"),a("em",[s._v("a")]),s._v("与"),a("em",[s._v("b")]),s._v("按位与的结果是否为"),a("em",[s._v("0")]),s._v("：")]),s._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("function")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("includesSomeLane")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[s._v("a"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("|")]),s._v(" Lane"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" b"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("|")]),s._v(" Lane")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("a "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("&")]),s._v(" b"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("!==")]),s._v(" NoLanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("p",[s._v("计算"),a("em",[s._v("b")]),s._v("这个"),a("code",[s._v("lanes")]),s._v("是否是"),a("em",[s._v("a")]),s._v("对应"),a("code",[s._v("lanes")]),s._v("的自己，需要判断"),a("em",[s._v("a")]),s._v("与"),a("em",[s._v("b")]),s._v("按位与的结果是否为"),a("em",[s._v("b")]),s._v("：")]),s._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("function")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("isSubsetOfLanes")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[s._v("set"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" subset"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("|")]),s._v(" Lane")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("set "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("&")]),s._v(" subset"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("===")]),s._v(" subset"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("p",[s._v("将两个"),a("code",[s._v("lane")]),s._v("或"),a("code",[s._v("lanes")]),s._v("的位合并只需要执行按位或操作：")]),s._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("function")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("mergeLanes")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[s._v("a"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("|")]),s._v(" Lane"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" b"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("|")]),s._v(" Lane")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" a "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("|")]),s._v(" b"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("p",[s._v("从"),a("code",[s._v("set")]),s._v("对应"),a("code",[s._v("lanes")]),s._v("中移除"),a("code",[s._v("subset")]),s._v("对应"),a("code",[s._v("lane（或lanes")]),s._v("），只需要对"),a("code",[s._v("subset")]),s._v("的"),a("code",[s._v("lane（或lanes）")]),s._v("执行按位非，结果再对"),a("code",[s._v("set")]),s._v("执行按位与：")]),s._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("function")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("removeLanes")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[s._v("set"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" subset"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("|")]),s._v(" Lane")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" Lanes "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" set "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("&")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("~")]),s._v("subset"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("h2",{attrs:{id:"总结"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[s._v("#")]),s._v(" 总结")]),s._v(" "),a("p",[a("code",[s._v("React")]),s._v("的优先级模型就是"),a("code",[s._v("lane")]),s._v("模型。而"),a("code",[s._v("lane")]),s._v("模型是用"),a("em",[s._v("32")]),s._v("位二进制数表示的，最高位是符号位，所以实际上会有"),a("em",[s._v("31")]),s._v("位参与到计算。通过对"),a("code",[s._v("lane")]),s._v("使用位运算，可以实现对"),a("code",[s._v("lane")]),s._v("模型的操作，如合并，移除等。")])])}),[],!1,null,null,null);t.default=n.exports}}]);