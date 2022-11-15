## 饥饿问题

因为状态更新存在优先级，所以当一直存在高优先级的更新，导致低优先级的更新阻塞不能被执行。这就是饥饿问题。

## 解决方式

在`ensureRootIsScheduled`方法中，会调用`markStarvedLanesAsExpired`方法。这个方法就是用来处理饥饿问题的。
```js
function markStarvedLanesAsExpired(
  root: FiberRoot,
  currentTime: number,
): void {
  // 获取变量
  const pendingLanes = root.pendingLanes;
  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;
  const expirationTimes = root.expirationTimes;
  // pendingLanes就是根节点保存的需要进行但还没有进行的lane
  let lanes = pendingLanes;
  // lanes有值，则遍历lanes
  while (lanes > 0) {
    // pickArbitraryLaneIndex方法的定义：31 - clz32(lanes)
    // clz32(lanes)可以计算出lanes开头0的个数。所以31 - clz32(lanes)就可以得出最左边的lane，即优先级最低的lane坐在的位置
    const index = pickArbitraryLaneIndex(lanes);
    // 获取这个优先级最低的lane
    const lane = 1 << index;
    // 获取这个lane对应的过期时间
    // expirationTimes是一个31个长度的数组，初始值都是-1，表示没有时间戳，即这个lane没有被定义过期时间
    const expirationTime = expirationTimes[index];
    // NoTimestamp = -1，作为判断这个lane是否有定义过期时间
    if (expirationTime === NoTimestamp) {
      if (
        (lane & suspendedLanes) === NoLanes ||
        (lane & pingedLanes) !== NoLanes
      ) {
        // 没有定义过期时间则调用computeExpirationTime方法计算一个过期时间
        expirationTimes[index] = computeExpirationTime(lane, currentTime);
      }
    } else if (expirationTime <= currentTime) {
      // 如果这个lane定义的过期时间小于当前时间，说明这个lane过期了，需要被执行
      // 将这个lane合并到expiredLanes中
      root.expiredLanes |= lane;
    }
    // 清除这个被定义过期时间的lane
    lanes &= ~lane;
  }
}
```
`markStarvedLanesAsExpired`方法主要做的工作是从`pendingLanes`中找到优先级最低的`lane`，并为它设置过期时间。如果这个`lane`已经过期的话，则会将这个`lane`合并到`expiredLanes`。  

那`expiredLanes`上保存的过期的`lane`又会如何执行呢？在`performConcurrentWorkOnRoot`方法中会调用`shouldTimeSlice`方法：
```js
  let exitStatus =
    shouldTimeSlice(root, lanes) &&
    (disableSchedulerTimeoutInWorkLoop || !didTimeout)
      ? renderRootConcurrent(root, lanes)
      : renderRootSync(root, lanes);
  }
```
这个方法的定义：
```js
function shouldTimeSlice(root: FiberRoot, lanes: Lanes) {
  // lanes是通过getNextLanes获取的最高优先级，只有这个lanes中包含过期的任务才会使用同步模式执行工作流程
  if ((lanes & root.expiredLanes) !== NoLanes) {
    return false;
  }

  if (
    allowConcurrentByDefault &&
    (root.current.mode & ConcurrentUpdatesByDefaultMode) !== NoMode
  ) {
    // 默认情况下，并发更新总是使用时间切片，即使用并发模式执行工作流程
    return true;
  }

  const SyncDefaultLanes =
    InputContinuousHydrationLane |
    InputContinuousLane |
    DefaultHydrationLane |
    DefaultLane;
  // lanes不包含以上这些lane的优先级，则会使用并发模式执行工作流程，否则使用同步模式执行工作流程
  return (lanes & SyncDefaultLanes) === NoLanes;
}
```
当优先级较低的更新过期之后，且产生的较高优先级更新都执行完成后，会以同步的方式执行较低优先级的更新对应的工作流程。

## 收尾工作

在`commitRootImpl`方法中会调用`markRootFinished`进行`lane`相关的收尾工作。
```js
function markRootFinished(root: FiberRoot, remainingLanes: Lanes) {
  // remainingLanes会收集当前Fiber树上应该进行但还没有进行的lanes
  // 而将pendingLanes移除与remainingLanes相关的lanes，就得到了已经完成的lanes
  const noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
  // 将应该进行但还没有进行的lanes赋值给pendingLanes
  root.pendingLanes = remainingLanes;

  // 将本次应该进行但还没有进行的lanes都合并到expiredLanes
  root.expiredLanes &= remainingLanes;

  const expirationTimes = root.expirationTimes;

  // 重置expirationTimes中虽然定义了过期时间，但是已经完成的lane
  let lanes = noLongerPendingLanes;
  while (lanes > 0) {
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;

    eventTimes[index] = NoTimestamp;
    // 重置过期时间为-1
    expirationTimes[index] = NoTimestamp;

    lanes &= ~lane;
  }
}
```
