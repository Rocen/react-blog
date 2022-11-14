## Fiber的含义

Fiber有三层含义：  
1. 作为架构来说，之前`React15`的`Reconciler`采用递归的方式工作，数据保存在递归调用栈中，所以被称为`Stack Reconciler`。`React16`的`Reconciler`
是基于`Fiber节点`实现的，被称为`Fiber Reconciler`。  
2. 作为静态数据结构来说，每个`Fiber`节点对应一个`React Element`，保存了该组件的类型(函数组件/类组件/原生组件)、及对应的DOM节点信息。
3. 作为动态的工作单元来说，每个Fiber节点保存了本次更新中，该组件改变了的状态、需要执行的工作(插入/更新/删除)。  
## Fiber的定义

```js
function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
) {
  // Instance
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null;

  // Fiber
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  // Effects
  this.flags = NoFlags;
  this.subtreeFlags = NoFlags;
  this.deletions = null;

  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  this.alternate = null;
}
```
### 作为架构
每个Fiber节点都有对应的React Element，那么多个Fiber节点之前是如何形成联系呢？  

主要靠如下三个属性：
```js
  // 指向父Fiber节点
  this.return = null;
  // 指向子Fiber节点
  this.child = null;
  // 指向兄弟Fiber节点
  this.sibling = null;
  // 执行与之关联的Fiber节点
  this.alternate = null;
```

### 作为静态数据结构
```js
  // Fiber对应组件的类型 Function/Class/Host...
  this.tag = tag;
  // key属性
  this.key = key;
  // 大部分情况同type
  this.elementType = null;
  // 对于 FunctionComponent，指函数本身，对于ClassComponent，指class，对于HostComponent，指DOM节点tagName
  this.type = null;
  // Fiber对应的真实DOM节点
  this.stateNode = null;
```

### 作为动态工作单元
```js
  // 保存本次更新造成的状态改变相关信息
  // 当前Fiber节点新产生的props
  this.pendingProps = pendingProps;
  // 当前Fiber节点具有的props
  this.memoizedProps = null;
  // 当前Fiber节点产生的update都会保存在这个属性上
  this.updateQueue = null;
  // 当前Fiber节点具有的state
  this.memoizedState = null;

  // 保存本次更新会造成的DOM操作
  // 对于当前Fiber节点需要执行的操作会保存在这个属性上，俗称”标记“
  this.flags = NoFlags;
  // 对于子孙Fiber节点树需要执行的操作会保存在这个属性上，俗称”标记“
  this.subtreeFlags = NoFlags;
  // 需要执行删除操作的子Fiber节点，会被保存在当前Fiber的这个属性上
  this.deletions = null;
  // 用于保存当前Fiber节点具有的优先级
  this.lanes = NoLanes;
  // 用于保存当前子孙Fiber节点具有的优先级
  this.childLanes = NoLanes;
```
