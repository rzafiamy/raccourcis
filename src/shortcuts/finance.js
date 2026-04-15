import { makeStep, getActionDef } from '../actions/index.js'

function step(type, overrides = {}) {
  const def = getActionDef(type)
  if (!def) throw new Error(`financeShortcuts: unknown action type "${type}"`)
  return { ...makeStep(def), ...overrides }
}

export default [
  {
    id: 330,
    name: 'FI Roadmap Builder',
    icon: 'map',
    color: 'bg-green',
    category: 'finance',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Your Situation',
        label: 'Describe your current income, savings, debt, and target lifestyle',
        placeholder: 'I earn 3200/month, save 400/month, have 6k debt, and want to reach financial independence',
      }),
      step('ai-prompt', {
        title: 'Build Roadmap',
        prompt: 'Create a practical financial independence roadmap from this starting point:\n\n{{result}}\n\nReturn: current strengths, biggest leaks, first 90-day moves, first 12-month moves, and what to track weekly.',
        systemPrompt: 'You are a beginner-friendly financial coach. Be realistic, practical, and educational. Do not promise returns.',
      }),
      step('show-result', { title: 'Financial Independence Roadmap', label: 'FI Roadmap' }),
    ],
  },
  {
    id: 331,
    name: 'Monthly Budget Reset',
    icon: 'wallet',
    color: 'bg-blue',
    category: 'finance',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Budget Inputs',
        label: 'Paste income, fixed costs, variable costs, debt payments, and savings goals',
        placeholder: 'Income: 3200; Rent: 900; Food: 400; Transport: 180; Debt: 250; Savings goal: 700',
      }),
      step('ai-prompt', {
        title: 'Draft Budget',
        prompt: 'Turn these raw monthly numbers into a clean beginner budget.\n\n{{result}}\n\nReturn: category table, spending limits, savings target, and 5 adjustments that improve cash flow.',
        systemPrompt: 'You are a budgeting coach who optimizes for simplicity and sustainable habits.',
      }),
      step('show-result', { title: 'Budget Plan', label: 'Monthly Budget' }),
    ],
  },
  {
    id: 332,
    name: 'Expense Category Classifier',
    icon: 'receipt',
    color: 'bg-orange',
    category: 'finance',
    steps: [
      step('clipboard-read', { title: 'Read Expenses' }),
      step('ai-prompt', {
        title: 'Classify Expenses',
        prompt: 'Classify each line item into a budgeting category and flag anything that looks like discretionary leakage.\n\n{{result}}\n\nReturn a clean grouped list plus top 3 areas to cut first.',
        systemPrompt: 'You are a precise household budgeting assistant.',
      }),
      step('show-result', { title: 'Expense Audit', label: 'Expense Categories' }),
    ],
  },
  {
    id: 333,
    name: 'Savings Rate Calculator',
    icon: 'percent',
    color: 'bg-cyan',
    category: 'finance',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Monthly Income',
        label: 'Monthly take-home income',
        placeholder: '3200',
      }),
      step('set-var', { title: 'Save Income', varName: 'income' }),
      step('user-input', {
        title: 'Monthly Savings',
        label: 'Monthly amount saved or invested',
        placeholder: '700',
      }),
      step('math-evaluate', {
        title: 'Compute Savings Rate',
        expression: '({{result}} / {{vars.income}}) * 100',
      }),
      step('ai-prompt', {
        title: 'Explain Result',
        prompt: 'My savings rate is {{result}}%. Explain what this means for a beginner pursuing financial independence, and suggest how to improve it without burnout.',
        systemPrompt: 'You are a calm and practical money coach.',
      }),
      step('show-result', { title: 'Savings Rate', label: 'Savings Rate Review' }),
    ],
  },
  {
    id: 334,
    name: 'Emergency Fund Planner',
    icon: 'shield',
    color: 'bg-indigo',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Core Expenses',
        label: 'Monthly essential expenses',
        placeholder: '1800',
      }),
      step('set-var', { title: 'Save Expenses', varName: 'core' }),
      step('user-input', {
        title: 'Current Emergency Fund',
        label: 'How much do you already have?',
        placeholder: '2500',
      }),
      step('set-var', { title: 'Save Current Fund', varName: 'fund' }),
      step('user-input', {
        title: 'Monthly Contribution',
        label: 'How much can you add each month?',
        placeholder: '300',
      }),
      step('set-var', { title: 'Save Contribution', varName: 'contrib' }),
      step('ai-prompt', {
        title: 'Plan Emergency Fund',
        prompt: 'Help me build an emergency fund plan.\n\nMonthly essentials: {{vars.core}}\nCurrent fund: {{vars.fund}}\nMonthly contribution: {{vars.contrib}}\n\nShow 3-month and 6-month fund targets, estimated time to reach each, and practical next steps.',
        systemPrompt: 'You are a conservative personal finance planner.',
      }),
      step('show-result', { title: 'Emergency Fund Plan', label: 'Emergency Fund' }),
    ],
  },
  {
    id: 335,
    name: 'Debt Avalanche Planner',
    icon: 'mountain',
    color: 'bg-red',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Debt List',
        label: 'Paste each debt with balance, APR, and minimum payment',
        placeholder: 'Card A: 2500 at 21%, min 80\nCard B: 1200 at 14%, min 45\nLoan: 4000 at 6%, min 120',
      }),
      step('ai-prompt', {
        title: 'Build Avalanche Plan',
        prompt: 'Create a debt avalanche payoff plan from this debt list:\n\n{{result}}\n\nExplain payoff order, rationale, cash-flow discipline, and the biggest mistakes to avoid.',
        systemPrompt: 'You are a debt coach who teaches from first principles and keeps people motivated.',
      }),
      step('show-result', { title: 'Debt Avalanche Plan', label: 'Avalanche Strategy' }),
    ],
  },
  {
    id: 336,
    name: 'Debt Snowball Planner',
    icon: 'snowflake',
    color: 'bg-blue',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Debt List',
        label: 'Paste each debt with balance and minimum payment',
        placeholder: 'Card A: 2500, min 80\nCard B: 1200, min 45\nLoan: 4000, min 120',
      }),
      step('ai-prompt', {
        title: 'Build Snowball Plan',
        prompt: 'Create a debt snowball payoff plan from this debt list:\n\n{{result}}\n\nExplain payoff order, psychology benefits, and how to stay consistent.',
        systemPrompt: 'You are a motivating debt coach for beginners.',
      }),
      step('show-result', { title: 'Debt Snowball Plan', label: 'Snowball Strategy' }),
    ],
  },
  {
    id: 337,
    name: 'Net Worth Snapshot',
    icon: 'scale',
    color: 'bg-green',
    category: 'finance',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Assets And Debts',
        label: 'Paste your assets and liabilities',
        placeholder: 'Cash: 4000\nBrokerage: 2500\nRetirement: 12000\nCredit card: -1800\nCar loan: -6000',
      }),
      step('ai-prompt', {
        title: 'Summarize Net Worth',
        prompt: 'Analyze this net worth snapshot:\n\n{{result}}\n\nReturn estimated net worth, strongest area, weakest area, and the next 3 leverage points for improvement.',
        systemPrompt: 'You are a personal finance analyst for beginners.',
      }),
      step('show-result', { title: 'Net Worth Review', label: 'Net Worth Snapshot' }),
    ],
  },
  {
    id: 338,
    name: 'Side Hustle Idea Finder',
    icon: 'briefcase',
    color: 'bg-yellow',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Skills And Constraints',
        label: 'Describe your skills, available time, and target extra income',
        placeholder: 'I can work 6 hours/week, know video editing and AI tools, and want an extra 400/month',
      }),
      step('ai-prompt', {
        title: 'Generate Hustles',
        prompt: 'Suggest 10 realistic side hustle ideas from this profile:\n\n{{result}}\n\nRank them by speed to first revenue, startup cost, and suitability for a beginner.',
        systemPrompt: 'You are a practical side-income strategist.',
      }),
      step('show-result', { title: 'Side Hustle Ideas', label: 'Income Ideas' }),
    ],
  },
  {
    id: 339,
    name: 'Income Goal Breakdown',
    icon: 'target',
    color: 'bg-indigo',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Income Goal',
        label: 'What monthly income do you want to reach?',
        placeholder: '5000',
      }),
      step('set-var', { title: 'Save Goal', varName: 'goal' }),
      step('user-input', {
        title: 'Current Monthly Income',
        label: 'What do you earn now?',
        placeholder: '3200',
      }),
      step('ai-prompt', {
        title: 'Break Down Gap',
        prompt: 'My current monthly income is {{result}} and I want to reach {{vars.goal}}.\n\nBreak down the income gap, practical paths to close it, and a 6-month action plan.',
        systemPrompt: 'You are a realistic income growth coach.',
      }),
      step('show-result', { title: 'Income Gap Plan', label: 'Income Goal' }),
    ],
  },
  {
    id: 340,
    name: 'Beginner Trade Checklist',
    icon: 'clipboard-check',
    color: 'bg-orange',
    category: 'finance',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Trade Idea',
        label: 'Describe the setup you want to take',
        placeholder: 'Buying an ETF after a pullback because trend is still up',
      }),
      step('ai-prompt', {
        title: 'Build Checklist',
        prompt: 'Create a beginner trade checklist for this setup:\n\n{{result}}\n\nInclude thesis, invalidation, risk size, time horizon, common mistakes, and a final go/no-go checklist.',
        systemPrompt: 'You are a risk-first trading mentor. Focus on discipline, not hype.',
      }),
      step('show-result', { title: 'Trade Checklist', label: 'Trade Checklist' }),
    ],
  },
  {
    id: 341,
    name: 'Position Size Calculator',
    icon: 'calculator',
    color: 'bg-blue',
    category: 'finance',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Account Size',
        label: 'Total account size',
        placeholder: '10000',
      }),
      step('set-var', { title: 'Save Account', varName: 'account' }),
      step('user-input', {
        title: 'Risk Percent',
        label: 'Percent of account to risk on this trade',
        placeholder: '1',
      }),
      step('set-var', { title: 'Save Risk', varName: 'riskPct' }),
      step('user-input', {
        title: 'Entry Price',
        label: 'Planned entry price',
        placeholder: '50',
      }),
      step('set-var', { title: 'Save Entry', varName: 'entry' }),
      step('user-input', {
        title: 'Stop Price',
        label: 'Planned stop-loss price',
        placeholder: '47',
      }),
      step('set-var', { title: 'Save Stop', varName: 'stop' }),
      step('math-evaluate', {
        title: 'Risk Dollars',
        expression: '{{vars.account}} * ({{vars.riskPct}} / 100)',
      }),
      step('set-var', { title: 'Save Risk Dollars', varName: 'riskDollars' }),
      step('math-evaluate', {
        title: 'Shares',
        expression: '{{vars.riskDollars}} / ({{vars.entry}} - {{vars.stop}})',
      }),
      step('ai-prompt', {
        title: 'Explain Position Size',
        prompt: 'Account size: {{vars.account}}\nRisk %: {{vars.riskPct}}\nEntry: {{vars.entry}}\nStop: {{vars.stop}}\nRisk dollars: {{vars.riskDollars}}\nApproximate position size: {{result}}\n\nExplain this trade size in beginner-friendly language and flag if anything looks dangerous.',
        systemPrompt: 'You are a conservative risk manager.',
      }),
      step('show-result', { title: 'Position Size Review', label: 'Position Size' }),
    ],
  },
  {
    id: 342,
    name: 'Risk Reward Planner',
    icon: 'scale',
    color: 'bg-cyan',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Entry Price',
        label: 'Entry price',
        placeholder: '50',
      }),
      step('set-var', { title: 'Save Entry', varName: 'entry' }),
      step('user-input', {
        title: 'Stop Price',
        label: 'Stop-loss price',
        placeholder: '47',
      }),
      step('set-var', { title: 'Save Stop', varName: 'stop' }),
      step('user-input', {
        title: 'Target Price',
        label: 'Target price',
        placeholder: '58',
      }),
      step('set-var', { title: 'Save Target', varName: 'target' }),
      step('math-evaluate', {
        title: 'Compute R Multiple',
        expression: '({{vars.target}} - {{vars.entry}}) / ({{vars.entry}} - {{vars.stop}})',
      }),
      step('ai-prompt', {
        title: 'Review Setup',
        prompt: 'Entry: {{vars.entry}}\nStop: {{vars.stop}}\nTarget: {{vars.target}}\nRisk-reward ratio: {{result}}\n\nExplain if this setup is attractive for a beginner and what could invalidate the plan.',
        systemPrompt: 'You are a disciplined trading coach focused on expectancy and risk control.',
      }),
      step('show-result', { title: 'Risk Reward Analysis', label: 'R:R Review' }),
    ],
  },
  {
    id: 343,
    name: 'Trading Journal Entry',
    icon: 'book-open',
    color: 'bg-green',
    category: 'finance',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Trade Notes',
        label: 'Paste your trade details and observations',
        placeholder: 'Ticker, setup, entry, stop, target, result, emotion, what happened',
      }),
      step('ai-prompt', {
        title: 'Structure Journal',
        prompt: 'Turn these raw trading notes into a structured journal entry:\n\n{{result}}\n\nInclude setup, risk plan, execution quality, emotional state, lessons, and one rule for next time.',
        systemPrompt: 'You are a performance coach for beginner traders.',
      }),
      step('create-docx', { title: 'Export Journal', title: 'Trading Journal Entry' }),
      step('show-result', { title: 'Saved Journal Entry', label: 'Trading Journal' }),
    ],
  },
  {
    id: 344,
    name: 'Loss Review',
    icon: 'triangle-alert',
    color: 'bg-red',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Losing Trade',
        label: 'Describe the losing trade',
        placeholder: 'Bought breakout, got stopped quickly, entered too early and ignored volume weakness',
      }),
      step('ai-prompt', {
        title: 'Review Loss',
        prompt: 'Analyze this losing trade with a coach mindset:\n\n{{result}}\n\nSeparate bad luck from bad process, identify the mistake class, and suggest 3 corrective habits.',
        systemPrompt: 'You are a performance psychologist for traders.',
      }),
      step('show-result', { title: 'Loss Debrief', label: 'Loss Review' }),
    ],
  },
  {
    id: 345,
    name: 'Win Review',
    icon: 'trophy',
    color: 'bg-yellow',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Winning Trade',
        label: 'Describe the winning trade',
        placeholder: 'Bought pullback in uptrend, respected stop, exited into strength',
      }),
      step('ai-prompt', {
        title: 'Review Win',
        prompt: 'Analyze this winning trade carefully:\n\n{{result}}\n\nExplain what was skill versus luck, what process should be repeated, and how to avoid overconfidence after the win.',
        systemPrompt: 'You are a grounded trading mentor.',
      }),
      step('show-result', { title: 'Win Debrief', label: 'Win Review' }),
    ],
  },
  {
    id: 346,
    name: 'Pre-Market Game Plan',
    icon: 'sunrise',
    color: 'bg-orange',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Market Context',
        label: 'Paste what you know about the market, watchlist, and catalysts',
        placeholder: 'SPY weak yesterday, CPI tomorrow, watching NVDA and a few AI names for continuation',
      }),
      step('ai-prompt', {
        title: 'Build Game Plan',
        prompt: 'Turn these notes into a beginner-friendly pre-market game plan:\n\n{{result}}\n\nReturn market bias, key watch items, trade criteria, what to avoid, and when to stay out.',
        systemPrompt: 'You are a methodical trading coach who prevents impulsive trades.',
      }),
      step('show-result', { title: 'Pre-Market Plan', label: 'Game Plan' }),
    ],
  },
  {
    id: 347,
    name: 'Post-Market Debrief',
    icon: 'sunset',
    color: 'bg-indigo',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Today Notes',
        label: 'Paste your market notes and trades from today',
        placeholder: 'Missed first move, took one revenge trade, then stopped. Best read was trend strength in QQQ.',
      }),
      step('ai-prompt', {
        title: 'Debrief Session',
        prompt: 'Create a post-market debrief from these notes:\n\n{{result}}\n\nReturn what went well, what went wrong, emotional triggers, process score, and one improvement for tomorrow.',
        systemPrompt: 'You are a trader development coach focused on reflection and consistency.',
      }),
      step('show-result', { title: 'Post-Market Debrief', label: 'Daily Debrief' }),
    ],
  },
  {
    id: 348,
    name: 'Watchlist Thesis Builder',
    icon: 'list-checks',
    color: 'bg-blue',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Watchlist Names',
        label: 'Paste the names or tickers you are watching and why',
        placeholder: 'QQQ for trend continuation; NVDA for strength; TSLA for possible breakdown',
      }),
      step('ai-prompt', {
        title: 'Write Thesis',
        prompt: 'Turn this rough watchlist into a clean watchlist sheet:\n\n{{result}}\n\nFor each name include thesis, invalidation, catalyst, and what would make it actionable.',
        systemPrompt: 'You are a trading planner who values clarity over prediction.',
      }),
      step('show-result', { title: 'Watchlist Thesis', label: 'Watchlist' }),
    ],
  },
  {
    id: 349,
    name: 'Earnings Prep Brief',
    icon: 'megaphone',
    color: 'bg-pink',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Company Or Ticker',
        label: 'Which company are you preparing for?',
        placeholder: 'NVIDIA',
      }),
      step('set-var', { title: 'Save Company', varName: 'company' }),
      step('google-search', {
        title: 'Collect Earnings Context',
        query: '{{vars.company}} earnings expectations guidance risks latest news',
        numResults: 8,
      }),
      step('ai-prompt', {
        title: 'Write Brief',
        prompt: 'Create an earnings prep brief for {{vars.company}} from these results:\n\n{{result}}\n\nReturn what matters most, key bull/bear angles, why volatility may increase, and what a beginner should avoid doing into earnings.',
        systemPrompt: 'You are an equity research assistant focused on risk awareness.',
      }),
      step('show-result', { title: 'Earnings Brief', label: 'Earnings Prep' }),
    ],
  },
  {
    id: 350,
    name: 'ETF Compare',
    icon: 'scale',
    color: 'bg-green',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'ETF Pair',
        label: 'Which ETFs do you want to compare?',
        placeholder: 'VOO vs QQQ',
      }),
      step('google-search', {
        title: 'Research ETFs',
        query: '{{result}} expense ratio holdings risk return differences beginner investor',
        numResults: 8,
      }),
      step('ai-prompt', {
        title: 'Compare ETFs',
        prompt: 'Compare these ETFs for a beginner investor using the following information:\n\n{{result}}\n\nExplain objective, concentration, volatility, fees, and what type of investor each ETF fits best.',
        systemPrompt: 'You are a long-term investing educator.',
      }),
      step('show-result', { title: 'ETF Comparison', label: 'ETF Compare' }),
    ],
  },
  {
    id: 351,
    name: 'Stock Research Starter',
    icon: 'search',
    color: 'bg-cyan',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Company Or Ticker',
        label: 'Which stock are you researching?',
        placeholder: 'Microsoft',
      }),
      step('set-var', { title: 'Save Name', varName: 'stock' }),
      step('google-search', {
        title: 'Research Company',
        query: '{{vars.stock}} business model moat risks growth valuation latest news',
        numResults: 8,
      }),
      step('ai-prompt', {
        title: 'Build Starter Brief',
        prompt: 'Create a beginner stock research starter brief for {{vars.stock}} from these results:\n\n{{result}}\n\nCover business model, growth drivers, risks, key questions, and what to learn next before investing.',
        systemPrompt: 'You are a beginner-friendly equity research teacher.',
      }),
      step('show-result', { title: 'Research Starter', label: 'Stock Research' }),
    ],
  },
  {
    id: 352,
    name: 'Macro News Digest',
    icon: 'newspaper',
    color: 'bg-indigo',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Macro Focus',
        label: 'What macro theme do you want to track?',
        placeholder: 'interest rates and inflation',
      }),
      step('google-search', {
        title: 'Collect Macro News',
        query: 'latest news on {{result}} and market impact',
        numResults: 8,
      }),
      step('ai-prompt', {
        title: 'Digest Macro News',
        prompt: 'Summarize these macro results for a beginner investor:\n\n{{result}}\n\nExplain what happened, why markets care, and what to watch next without using jargon.',
        systemPrompt: 'You are a macro educator for retail investors.',
      }),
      step('show-result', { title: 'Macro Digest', label: 'Macro News' }),
    ],
  },
  {
    id: 353,
    name: 'Chart Pattern Study Notes',
    icon: 'bar-chart-2',
    color: 'bg-orange',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Pattern',
        label: 'Which chart pattern are you learning?',
        placeholder: 'bull flag',
      }),
      step('google-search', {
        title: 'Research Pattern',
        query: '{{result}} chart pattern explanation examples risks entry stop beginner',
        numResults: 8,
      }),
      step('ai-prompt', {
        title: 'Write Study Notes',
        prompt: 'Create study notes for this chart pattern using these search results:\n\n{{result}}\n\nExplain structure, context, entry logic, invalidation, and the traps beginners fall into.',
        systemPrompt: 'You are a technical analysis teacher focused on context and risk.',
      }),
      step('show-result', { title: 'Pattern Notes', label: 'Study Notes' }),
    ],
  },
  {
    id: 354,
    name: 'Portfolio Allocation Draft',
    icon: 'pie-chart',
    color: 'bg-blue',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Investor Profile',
        label: 'Describe age, time horizon, risk tolerance, and goals',
        placeholder: 'Age 30, 20+ year horizon, moderate risk, want growth but still sleep well',
      }),
      step('ai-prompt', {
        title: 'Draft Allocation',
        prompt: 'Draft a simple beginner portfolio allocation from this profile:\n\n{{result}}\n\nInclude broad categories, why each belongs, what percentage ranges may fit, and rebalancing guidance. Keep it educational and non-prescriptive.',
        systemPrompt: 'You are a passive investing educator focused on diversification and simplicity.',
      }),
      step('show-result', { title: 'Allocation Draft', label: 'Portfolio Draft' }),
    ],
  },
  {
    id: 355,
    name: 'DCA Planner',
    icon: 'repeat',
    color: 'bg-green',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Contribution Amount',
        label: 'How much do you want to invest regularly?',
        placeholder: '300',
      }),
      step('set-var', { title: 'Save Amount', varName: 'amount' }),
      step('user-input', {
        title: 'Investment Vehicle',
        label: 'What are you investing in?',
        placeholder: 'broad market ETF',
      }),
      step('ai-prompt', {
        title: 'Plan DCA',
        prompt: 'Create a dollar-cost averaging plan for investing {{vars.amount}} regularly into {{result}}.\n\nExplain cadence options, habit design, cash management, and common beginner mistakes.',
        systemPrompt: 'You are a long-term investing coach who values consistency over prediction.',
      }),
      step('show-result', { title: 'DCA Plan', label: 'DCA Planner' }),
    ],
  },
  {
    id: 356,
    name: 'Retirement Contribution Planner',
    icon: 'piggy-bank',
    color: 'bg-pink',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Retirement Context',
        label: 'Describe age, current retirement savings, monthly contribution, and target retirement age',
        placeholder: 'Age 31, retirement savings 18k, investing 450/month, target retirement age 60',
      }),
      step('ai-prompt', {
        title: 'Plan Contributions',
        prompt: 'Using this retirement context, suggest a contribution improvement plan:\n\n{{result}}\n\nExplain priority order, what milestones to track, and how to increase contributions over time.',
        systemPrompt: 'You are a retirement planning educator for beginners.',
      }),
      step('show-result', { title: 'Retirement Plan', label: 'Retirement Planner' }),
    ],
  },
  {
    id: 357,
    name: '30-Day Spending Cut Plan',
    icon: 'scissors',
    color: 'bg-red',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Spending Problem',
        label: 'Where do you think your spending is leaking?',
        placeholder: 'food delivery, subscriptions, random impulse buys',
      }),
      step('ai-prompt', {
        title: 'Build 30-Day Plan',
        prompt: 'Create a 30-day spending cut plan for this spending problem:\n\n{{result}}\n\nMake it realistic, habit-based, and focused on keeping quality of life intact.',
        systemPrompt: 'You are a behavioral finance coach, not an extreme frugality guru.',
      }),
      step('show-result', { title: 'Spending Cut Plan', label: '30-Day Plan' }),
    ],
  },
  {
    id: 358,
    name: 'Weekly Money Review',
    icon: 'calendar-check',
    color: 'bg-indigo',
    category: 'finance',
    favorite: true,
    steps: [
      step('user-input', {
        title: 'Weekly Notes',
        label: 'Paste your money moves from the week',
        placeholder: 'Saved 180, overspent on dining, invested 300, no debt progress, reviewed brokerage account twice too emotionally',
      }),
      step('ai-prompt', {
        title: 'Review The Week',
        prompt: 'Turn these weekly money notes into a short review:\n\n{{result}}\n\nReturn wins, leaks, habits to reinforce, one priority for next week, and one mindset reminder.',
        systemPrompt: 'You are a weekly accountability coach for financial independence.',
      }),
      step('show-result', { title: 'Weekly Money Review', label: 'Weekly Review' }),
    ],
  },
  {
    id: 359,
    name: 'Money Rules Manifesto',
    icon: 'book-open',
    color: 'bg-yellow',
    category: 'finance',
    steps: [
      step('user-input', {
        title: 'Your Goals And Weaknesses',
        label: 'Describe your financial goals and the mistakes you repeat',
        placeholder: 'I want long-term financial freedom but keep impulse spending and revenge trading',
      }),
      step('ai-prompt', {
        title: 'Write Rules',
        prompt: 'Create a personal money rules manifesto from this profile:\n\n{{result}}\n\nWrite 10 simple rules covering spending, saving, investing, trading, and emotional discipline.',
        systemPrompt: 'You are a personal operating-system designer for money behavior.',
      }),
      step('create-docx', { title: 'Export Money Rules', title: 'Money Rules Manifesto' }),
      step('show-result', { title: 'Saved Money Rules', label: 'Money Rules' }),
    ],
  },
]
