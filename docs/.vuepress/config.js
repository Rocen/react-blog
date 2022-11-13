module.exports = {
    head: [
        [
            'link',
            {
                rel: 'icon', 
                href: 'faviocn.ico'
            }
        ]
    ],
    title: 'React',
    description: 'React',
    base: '/vuepress-blog/',
    themeConfig: {
        nav: [
            {
                text: '🆒 github',
                link: 'https://github.com/Rocen',
                icon: 'reco-github',
                target:'_blank'
            }
        ],
        sidebar: [
            {
                title:'开始',
                collapsable: false,
                path: '/',
                children: [
                    {
                        title: "章节列表",
                        path: "/docs/start/directory"
                    },
                    {
                        title: "拉取源码",
                        path: "/docs/start/pullSource"
                    }
                ]
            },
            {
                title: "理念", 
                children: [
                    {
                        title: "React理念",
                        path: "/docs/idea/concept",
                    },
                    {
                        title: "React架构",
                        path: "/docs/idea/architecture",
                    },
                    {
                        title: "Fiber架构的实现原理",
                        path: "/docs/idea/fiber"
                    },
                    {
                        title: "Fiber结构的工作原理",
                        path: "/docs/idea/doubleCache"
                    },
                    {
                        title: "React工作流程",
                        path: "/docs/idea/workProcess"
                    },
                ]
            },
            {
                title: "架构",
                children: [
                    {
                        title: "Scheduler（调度器）",
                        path: "/docs/architecture/scheduler",
                    },
                    {
                        title: "Reconciler（协调器）",
                        path: "/docs/architecture/reconciler",
                    },
                    {
                        title: "Renderer（渲染器）",
                        path: "/docs/architecture/renderer",
                    }
                ]
            },
            {
                title: "实现", 
                children: [
                    {
                        title: "diff算法",
                        path: "/docs/implement/diff"
                    },
                    {
                        title: "状态更新",
                        path: "/docs/implement/updateState"
                    },
                    {
                        title: "Scheduler工作流程",
                        path: "/docs/implement/scheduler"
                    },
                    {
                        title: "lane模型",
                        path: "/docs/implement/lane"
                    },
                    {
                        title: "批量更新",
                        path: "/docs/implement/batchedUpdates"
                    },
                    {
                        title: "Suspense",
                        path: "/docs/implement/suspense"
                    },
                    {
                        title: "饥饿问题",
                        path: "/docs/implement/starve"
                    },
                ]
            },
            {
                title: "概念",
                children: [
                    {
                        title: "生命周期",
                        path: "/docs/concept/lifeCycle"
                    },
                    {
                        title: "事件系统",
                        path: "/docs/concept/eventSystem"
                    },
                    {
                        title: "错误边界",
                        path: "/docs/concept/errorBoundary"
                    },
                ]
            },
            {
                title: "Hooks", 
                children: [
                    {
                        title: "useState和useReducer",
                        path: "/docs/hooks/useStateAnduseReducer"
                    },
                    {
                        title: "useEffect",
                        path: "/docs/hooks/useEffect"
                    },
                    {
                        title: "useEffect的执行",
                        path: "/docs/hooks/executeUseEffect"
                    },
                    {
                        title: "useRef",
                        path: "/docs/hooks/useRef"
                    },
                    {
                        title: "useMemo和useCallback",
                        path: "/docs/hooks/useMemoAnduseCallback"
                    },
                    {
                        title: "useTransition",
                        path: "/docs/hooks/useTransition"
                    },
                ]
            },
            {
                title: "原理",
                children: [
                    {
                        title: "组件渲染和性能优化",
                        path: "/docs/principle/componentRenderAndOptimize"
                    },
                    {
                        title: "setState和useState的区别",
                        path: "/docs/principle/differentBetweenSetStateAndUseState"
                    },
                    {
                        title: "useState是同步还是异步",
                        path: "/docs/principle/isUseStateSyncOrAsync"
                    },
                ]
            },
            {
                title: "发现",
                children: [
                    {
                        title: "React中的性能优化",
                        path: "/docs/find/performanceOptimize"
                    }
                ]
            }
        ]
    },
    locales: {
        '/': {
            lang: 'zh-CN'
        }
    },
    lastUpdated: 'Last Updated',
    plugins: [
        [
            "vuepress-plugin-nuggets-style-copy", 
            {
                copyText: "复制代码",
                tip: {
                    content: "复制成功"
                }
            }
        ]
    ]
}