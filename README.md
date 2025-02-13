# This is the [Browserslist](https://github.com/browserslist/browserslist) config for use in RVU products

[This config is published to GitHub](https://github.com/uswitch/browserslist-config/pkgs/npm/browserslist-config) and can be used anywhere by simply adding `extends @uswitch/browserslist-config` to your browserslist config, the easiest way to use this config is to add the following to your package.json file

```json
  "browserslist": [
    "extends @uswitch/browserslist-config"
  ]
```

Current Support

```
  Safari >= 10.3
  iOS >= 10.3
  Chrome >= 58
  Samsung >= 11
  Firefox ESR
  Firefox >= 54
  Edge >= 80
  Android >= 58
```

[Supported browsers can be found on Notion](https://www.notion.so/rvu/Browser-support-4f8c037f60ef4245a84d36913215e079)

## Publishing

You can publish the current version with `npm publish`, which will push your build to [the package's GitHub packages page](https://github.com/uswitch/browserslist-config/pkgs/npm/browserslist-config). After that it can be installed with standard commands like `npm i -D @uswitch/browserslist-config@1`.

## Generating analyses

Included in this repo is a script that you can use to help pick a browserslist config.

To run the script, you need CSVs in `./analyse/sources/source-name` taken from Google Analytics. An Exploration has been created to help with this [here](https://analytics.google.com/analytics/web/#/report/visitors-browser/a207299w265509p47160568/_u.date00=20221013&_u.date01=20230112/) but the files need to be cleaned up before being processed.

- Export exploration dataset
- Open CSV in your code editor
- Remove the comment block at the top of the file so that line 1 is the header row
- Remove line 2 which contains the totals summary
- Ensure that you save the file without a blank final line

When you run the script, you should provide the folder `source-name` as the environment variable `DATASET`, so the script knows where to get the sources.

You may find that some cells are blank (for example, if the browser name is `(not set)` then it will likely have a blank version number).

The script works by sorting the CSV rows by session, descending, taking up to a target percentile (by default 99%) and then generating a support table containing the lowest version of each browser in the list with the 1% tail removed. When taking the target percentile, all the browsers with names matching this regex are skipped: `/explorer|silk|opera|uc browser|mozilla compatible agent/i`. In theory this means you could fail to meet the target percentile, but for the 2022-3 data, this did not happen.

As well as creating a browser support table, the script returns `machineFriendlySupportTable` and `supportTableSupports`. `supportTableSupports` is the number of sessions covered by the browsers in your support table. This can be higher than your target percentile, because sometimes version N of a browser will have enough sessions to be included in your support table, even though browser N+1 doesn't. Because the support table is for minimum supported versions not maximum supported versions, when we support version N, we also support N+1 and N+1's sessions are therefore added to the total supported sessions.

The outputs `supportTableSupports` and `machineFriendlySupportTable` correspond to two optional environment variables, `TARGET_PERCENTILE` and `SUPPORT_TABLE`. `TARGET_PERCENTILE` is used to choose how selective the script is when it creates a support table from the dataset. `SUPPORT_TABLE` lets you pass in a custom support table to check what percentage of sessions is supported by your proposed table. Passing in a custom support table bypasses generation, making `TARGET_PERCENTILE` useless.

To see these in action, let's run through a way we might get a report for the 2022-3 data.

First,

```bash
DATASET=2022-3 npm run analyse
```

would print

```js
{
  supportTable: {
    Safari: '5.0.2',
    Chrome: '40.0.2214.109',
    'Samsung Internet': '2.1',
    'Android Webview': '30.0.0.0',
    Firefox: '48',
    Edge: '14.14393',
    'Android Browser': '4',
    'Safari (in-app)': '15'
  },
  machineFriendlySupportTable: '{"Safari":"5.0.2","Chrome":"40.0.2214.109","Samsung Internet":"2.1","Android Webview":"30.0.0.0","Firefox":"48","Edge":"14.14393","Android Browser":"4","Safari (in-app)":"15"}',
  supportTableSupports: '99.200% of sessions'
}
```

This is not an ideal support table, because because we'd rather not support Safari 5. But we're supporting 99.2% of sessions, when our aim is to support 99%. If we lower the `TARGET_PERCENTILE` to 98.45, we get a better support table which still covers 99% of sessions:

```bash
DATASET=2022-3 TARGET_PERCENTILE=98.45 npm run analyse
```

```js
{
  supportTable: {
    Safari: '9',
    Chrome: '55.0.2883.91',
    'Samsung Internet': '11',
    'Android Webview': '77.0.3865.92',
    Firefox: '52',
    Edge: '90.0.818.51'
  },
  machineFriendlySupportTable: '{"Safari":"9","Chrome":"55.0.2883.91","Samsung Internet":"11","Android Webview":"77.0.3865.92","Firefox":"52","Edge":"90.0.818.51"}',
  supportTableSupports: '99.074% of sessions'
}
```

This is better but can still be improved. [Every one of these browsers has some support for `position: sticky` except Chrome 55](https://caniuse.com/?compare=chrome+55,safari+9,firefox+52,opera+90,samsung+7.2-7.4&compareCats=all). For `position: sticky` we'd need Chrome 56, but we can't get Chrome 56 by lowering the target percentile without `supportTableSupports` falling below 99%.

At this point we can tweak the table to use Chrome 56 instead of 55 and check our new table's support:

```bash
DATASET=2022-3 SUPPORT_TABLE='{"Safari":"9","Chrome":"56","Samsung Internet":"11","Android Webview":"77","Firefox":"52","Edge":"90"}' npm run analyse
```

```js
{
  supportTable: {
    Safari: '9',
    Chrome: '56',
    'Samsung Internet': '11',
    'Android Webview': '77',
    Firefox: '52',
    Edge: '90'
  },
  machineFriendlySupportTable: '{"Safari":"9","Chrome":"56","Samsung Internet":"11","Android Webview":"77","Firefox":"52","Edge":"90"}',
  supportTableSupports: '99.069% of sessions'
}
```

With this support table, we're still above 99% of sessions, and there are no major features we're likely to want to use, like `position: sticky`, missing.
