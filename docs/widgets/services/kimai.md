---
title: Kimai
description: Kimai Widget Configuration
---

Learn more about [Kimai](https://www.kimai.org/).

Generate an API token under `My Profile > API Access > Create new API token`. The token uses the same permissions as the user that owns it, so the widget will report that user's timesheet totals.

Allowed fields: `["active", "today", "week", "payPeriod"]`.

```yaml
widget:
  type: kimai
  url: https://kimai.host.or.ip
  key: kimai-api-token
```

## Pay period

By default the "Pay Period" field shows the same range as the current week (Monday through now). To track a custom pay period, set the anchor date and the period length:

```yaml
widget:
  type: kimai
  url: https://kimai.host.or.ip
  key: kimai-api-token
  payPeriodStart: "2025-01-06"   # the first day of any past or future pay period
  payPeriodLength: biweekly      # weekly, biweekly, monthly, or a number of days
```

The widget rolls the anchor forward by the configured length to find the current period that contains today, so you only need to set the anchor once.

Allowed `payPeriodLength` values:

- `weekly` (7 days)
- `biweekly` (14 days)
- `monthly` (uses the day-of-month from `payPeriodStart`)
- any positive integer (number of days)
