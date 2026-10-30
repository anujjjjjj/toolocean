# IndexNow

IndexNow tells Bing, Yandex, Seznam, Naver and the other participating engines
that URLs changed, so they recrawl without waiting for the sitemap. Google does
not take part.

## Key

The key is `654ba38f42abe57769c1a6ad9c1a742e`. It is public by design: the file
`public/654ba38f42abe57769c1a6ad9c1a742e.txt` contains the key and is served at
`https://toolocean.co/654ba38f42abe57769c1a6ad9c1a742e.txt`, which is how the
engines verify that a submission comes from the site owner. `scripts/indexnow.mjs`
reads that file. `INDEXNOW_KEY` overrides it, which is only useful for testing.

Do not rename or delete the key file. A submission whose key file 404s is ignored.

## Commands

```bash
npm run indexnow -- --dry-run   # count and preview, no network request
npm run indexnow                # submit every URL in public/sitemap.xml
npm run indexnow:changed        # only URLs whose <lastmod> changed since the last local run
```

`npm run indexnow` reads `public/sitemap.xml` (falling back to `dist/sitemap.xml`),
so run `npm run sitemap` or a build first. It POSTs to
`https://api.indexnow.org/indexnow` in batches of up to 10,000 URLs and fails if
any sitemap URL is not on `toolocean.co`. A 200 or 202 response is success; 202
means the key is still being verified.

## Automatic submission

`.github/workflows/indexnow.yml` runs on GitHub's `deployment_status` event, which
Vercel's GitHub integration emits for every deployment. The job continues only when
all of these hold:

1. `deployment_status.state == 'success'`: the deploy finished.
2. `deployment.environment == 'Production'`: Vercel's production environment.
   Preview deployments, including every PR, use `Preview` and are skipped.
3. The deployment is main: `deployment.ref` is `main`, or `deployment.sha` equals
   the current head of `main` (Vercel usually reports the sha as the ref).

It then checks out the deployed commit, installs with `npm ci` on Node 22, runs
`npm run sitemap` and `npm run indexnow`. Nothing else in CI calls IndexNow, and
`npm run build` never does.

If Vercel's production environment is ever renamed, update the `environment`
condition in the workflow; otherwise the job silently skips every deploy.

## Checking it worked

The workflow log prints `IndexNow: <n> URL(s) (--all)` and the response status.
Bing Webmaster Tools shows received submissions under IndexNow.
