## React Effect List的重构
本文来看看React内部Effects List机制重构的前因后果。  
### 什么是副作用
React的工作流程可以简单的概括为：
+ 触发更新
+ render阶段：计算更新会造成的副作用
+ commit阶段：执行副作用  

其中”副作用“包含很多类型，比如：
+ Placement：指DOM节点的插入或者移动
+ Passive：指useEffect需要执行回调函数
+ Update：指需要更新DOM节点的属性
+ 等...  

那么每个节点需要执行的副作用是如何保存的呢？
### Effects List
在重构前，render阶段中带有副作用的节点会连接形成单向链表。这条链表就被称为Effects List。  
比如，B、C、E存在副作用，将会连接形成Effects List。  
而在commit阶段就不需要再从A节点向下深度遍历整棵树，只需要遍历Effects List就能找到所有存在副作用的节点并执行相应的操作了。
### Subtree Flags
在重构之后，在render阶段，对于执行completeWork方法的节点会调用bubbleProperties方法，进行子节点向父节点冒泡的过程。最终，收集到子节点的flags会保存到父节点的Subtree Flags属性上。  
比如，B、C、E包含的副作用如图：
冒泡过程如下（其中节点的副作用对应的属性就是flags）：
1. B的flags为Passive，会冒泡到A，所以A.SubtreeFlags就包含Passive。
2. E的flags为Placement，会冒泡到D，所以D.SubtreeFlags包含Placement
3. D的flags冒泡到C，所以C.SubtreeFlags包含Placement
4. C的flags为Update，所以C.SubtreeFlags包含Placement，然后C再冒泡到A
5. 最终A.SubtreeFlags包含Passive、Placement、Update  

当执行完这个过程，A节点的SubtreeFlags就包含这三种副作用。  
在commit阶段，在根据SubtreeFlags一层一层查找拥有副作用的节点执行对应的操作。  
可见，SubtreeFlags需要重新遍历整棵树，而Effects List只需要遍历单向链表即可。显然后者的执行效率是更高的，那么为什么React还要重构掉呢？
### Suspense
答案是：SubtreeFlags遍历子树的操作虽然比Effects List需要遍历更多的节点，但是React18中一种新特性恰恰需要遍历子树。  
这个特性就是Suspense。  
在开启并发之前，React保证一次render阶段对应一次commit阶段。开启并发之后，针对Suspense内不显示的子树，即不会渲染内容，也不会执行useEffect的回调。要实现这部分处理的基础，就是改变commit阶段遍历的方式，即遍历子树寻找Suspense组件，如果找到了Suspense组件则不会再向下遍历子树执行子节点的副作用了。
### 总结
针对Suspense的这次改进，为React带来一种新的内部组件类型--Offscreen Component。未来它可能是实现React版keep-alive的基础。