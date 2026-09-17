# 独立任务：计分、旅行记录、Toy 平台适配

用户授权实施。项目 TS strict + Vite + Vitest。你只拥有 src/run.ts、src/journal.ts、src/platform/toy.ts 和对应新增测试，不要改其他文件、不提交、不再派子代理。父任务并行实现内容/游戏接入。

先写行为测试并确认失败，再实现。需要认真处理冻结、去重、离线和不可信云数据。

## 必须提供的接口

src/run.ts:
- export type ScoreTargets={collect:Record<string,number>;events:string[];feats:Record<string,number>}
- export type RunResult 包含 runId, levelId, contentVersion, eligible, activeSeconds, effectiveSeconds, resets, collectedIds:string[], eventIds:string[], featIds:string[], breakdown:{collect:number;events:number;feats:number;clear:number;speed:number;total:number}, badges:string[]，及 completedAt:number。
- export class RunSession: constructor(levelId:string,targets:ScoreTargets,eligible:boolean,contentVersion='living-v1'); advance(seconds:number,active:boolean):void; award(kind:'collect'|'event'|'feat',id:string):boolean; rewind():void; invalidate():void; finish():RunResult; result?:RunResult; activeSeconds:number; effectiveSeconds getter; contentScore getter; preview() 返回当前分项（未通关 clear/speed=0）。
- collect=4000*已得权重/总权重，events=2000*完成个数/总数，feats=1500*权重/总权重，各项向下取整，空分类=0。通关500。speed=floor(2000*max(0,1-effectiveSeconds/base))，forest/honey base360其余480。rewind加5秒罚时。拒绝负数非有限时间和未知ID。冻结后全部无变化；重复finish保持相同对象内容。随机 runId 只用于去重，不影响规则。
- 徽章 clear/collector/ecologist/challenger，后三者要求目标非空且全部完成。数据返回不可被外部改写内部账本。eligible非正式level恒false。

src/journal.ts 独立于 progress.ts，保留旧存档：
- Journal 包含 discovered:string[], souvenirs:string[], cleared:string[], badges:Record<string,string[]>, best:Record<string,RunResult>, toyConsent:boolean；可自行添加纯外观字段。
- loadJournal(storage?),saveJournal(journal,storage?), emptyJournal(), recordDiscovery(journal,id),recordSouvenir(journal,id),recordRun(journal,result),mergeJournal(local,remote) 函数：返回更新的Journal（不要修改输入），并集永久发现，best按高分保留，同分用更短时间。只接受有效形状/有限值/安全范围，旧缺失字段默认值。
- encodeCloud(journal):Record<string,string> 与 mergeCloud(journal,values:Record<string,string>):Journal：每个value UTF8<=1024 bytes，拆分条目或压缩摘要，key不以__开头，总key<=128；个人云端不能保存toyConsent或本地输入设置。远端best可以用精简信息，确保往返保留自己的时间/分项/收集率信息。记录发现数量有合理上限且本计划数十/百项可完整保存。忽略原型污染键/损坏字段。

src/platform/toy.ts:
- 精确按 docs/toy-js-sdk-abilities.md 读取并实现接口类型，SDK为window.toy，但提供注入式构造以测试。
- export class ToyService: supported(ability):Promise<boolean>; submit(result:RunResult):Promise<{score:number}>（校验eligible、有效结果并按runId去重；每次有效完赛都提交本局绝对分数，不能只比历史最佳）； ranks(levelId,period='all',refresh=false)返回{list:RankItem[],mine?:MyRank}，缓存且游客能读；loadCloud():Promise<Record<string,string>>;saveCloud(values):Promise<void>，缺失SDK有可供UI展示的错误而不抛未处理异常；configureContainer(listener)能力探测、先监听再请求横屏沉浸，返回取消函数。
- 榜位forest1/honey2/tide3/wind4/mirror5；ranked字段判断上榜。submit重试只在当次请求内对限流/暂时网络失败有限退避，授权拒绝/非法参数不重试。首次授权由父层显式点击后调用submit，service不得自主索取profile。
- 禁止提交跨会话积压、禁止重复自动提交同run；拒绝的操作允许用户重试，已成功不能重交。同run并发共享请求。

测试覆盖全部计分上限/时间截断/暂停/冻结/去重/召唤ID/回溯/非法数字，永久并集合并，云每值上限与损坏数据，映射5boards、较低新成绩仍提交、历史最佳回执不覆盖本局、失败与并发去重、游客读榜、限流退避（虚拟计时器）和SDK缺失。

完成后写 docs/task-score-toy-report.md，列出公共接口、测试命令结果与限制；给父任务发简短报告。
