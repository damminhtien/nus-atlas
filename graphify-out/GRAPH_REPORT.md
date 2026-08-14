# Graph Report - learn-atlas  (2026-08-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 490 nodes · 1257 edges · 45 communities (36 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `36166698`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 22
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32

## God Nodes (most connected - your core abstractions)
1. `draw()` - 150 edges
2. `push()` - 50 edges
3. `router()` - 30 edges
4. `save()` - 25 edges
5. `bindGo()` - 25 edges
6. `renderLecture()` - 21 edges
7. `unlock()` - 19 edges
8. `flushAchievements()` - 19 edges
9. `step()` - 18 edges
10. `reducedMotion()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `draw()` --indirect_call--> `raw()`  [INFERRED]
  js/viz.js → js/store.js
- `countUp()` --indirect_call--> `tick()`  [INFERRED]
  js/app.js → js/viz.js
- `runMasteryDrill()` --indirect_call--> `draw()`  [INFERRED]
  js/app.js → js/viz.js

## Import Cycles
- None detected.

## Communities (45 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (48): addFocusSession(), addXP(), blank(), bumpMastery(), cardState(), celebrateTopicOnce(), checkCourseCompletion(), clearMiss() (+40 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (38): applyTextScale(), boot(), closePalette(), closeShortcuts(), closeSidebar(), codeKey(), commandActions(), cycleTextScale() (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (36): acf(), argmax(), backtrace(), betaPdf(), bootMeans(), chooseArm(), curve(), data() (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (33): cellCol(), colorFor(), dact(), draw(), eig(), ent(), fcSD(), fillTail() (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (24): act(), binomPMF(), br(), errs(), inertia(), joint(), lrAt(), mapY() (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (21): achIds, checkRender(), cp, dollarOdd(), errors, fs, gseen, ids (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (31): applyMerge(), bestPair(), button(), canvas(), controls(), conv(), corpusTokens(), cssVar() (+23 more)

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (21): allQuestions(), animateBig(), confetti(), flushAchievements(), levelUpCelebrate(), missedItems(), mountQuickCheck(), renderChrome() (+13 more)

### Community 8 - "Community 8"
Cohesion: 0.26
Nodes (21): bindGo(), docTitleFor(), emptyState(), findCourse(), findLesson(), router(), sweepBars(), view404() (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.20
Nodes (18): buildLessonTOC(), celebrateLessonDone(), directPrereqs(), explicitPrereqs(), flatLessons(), floatXP(), hydrateViz(), index() (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (16): clamp(), dragKeys(), frozenD(), gauss(), genData(), gss(), initCentroids(), jsd() (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (15): addSamples(), animateTo(), crossings(), f(), findDelta(), globalMin(), loop(), play() (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.19
Nodes (14): achProgressMap(), dailyConcept(), dailyDeepDive(), dailyViz(), dayNumber(), fmtTime(), isReady(), mulberry() (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (9): BASE, describe(), esc(), fs, lessonPage(), OUT, path, staticizeContent() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (12): addServer(), expectedJ(), gradStep(), ownerOf(), recompute(), removeServer(), reset(), setPlay() (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (12): build(), d2(), feats(), gini(), polyfit(), randn(), reseed(), seed() (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.24
Nodes (10): cellAt(), greedy(), greedyA(), iterate(), nextState(), qstep(), rewardOf(), runAgent() (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (9): clearResumePill(), currentLessonId(), initReadProgress(), offerResume(), readPosMap(), saveReadPos(), scheduleReadProgress(), updateReadProgress() (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (8): drawHeatmap(), drawSim(), drawWaves(), hex(), _hx(), mix(), pe(), toRGB()

### Community 19 - "Community 19"
Cohesion: 0.50
Nodes (5): buildHeatmap(), countUp(), reduceMotionOn(), toggleReduceMotion(), viewStats()

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (9): acc(), cheb(), distMean(), fit(), fitP(), gdStep(), loss(), sig() (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (3): ise(), kde(), tf()

## Knowledge Gaps
- **21 isolated node(s):** `BASE`, `fs`, `OUT`, `path`, `urls` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `draw()` connect `Community 3` to `Community 0`, `Community 2`, `Community 4`, `Community 6`, `Community 7`, `Community 10`, `Community 11`, `Community 14`, `Community 15`, `Community 16`, `Community 18`, `Community 20`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.460) - this node is a cross-community bridge._
- **Why does `runMasteryDrill()` connect `Community 7` to `Community 8`, `Community 1`, `Community 3`?**
  _High betweenness centrality (0.284) - this node is a cross-community bridge._
- **Why does `raw()` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.199) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `draw()` (e.g. with `runMasteryDrill()` and `raw()`) actually correct?**
  _`draw()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `router()` (e.g. with `boot()` and `renderQuiz()`) actually correct?**
  _`router()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `BASE`, `fs`, `OUT` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06919945725915876 - nodes in this community are weakly interconnected._