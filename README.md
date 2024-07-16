# ANS Contracts

## Install

```
npm install
```

## Start a local devnet for testing and development

`./docker`

```bash
docker-compose up
```

Please refer to the documentation here: https://github.com/alephium/alephium-stack/blob/master/devnet/docker-compose.yml or https://wiki.alephium.org/full-node/devnet

## Compile

Compile the TypeScript files into JavaScript:

```
npx @alephium/cli@latest compile
```

## Testing

```
npx @alephium/cli@latest test
```

## Code Review Change Logs

- TTL check on `setProfile`
- Caller constraints enhancement on `setProfile`
- Add name resolver interface
- Burn credential token if minted on transfer
- Make profiles map mutable and update profile if it exists for gas optimizations
- Fix `purgeExpiredName` `assetsInContract`
- Nits: Alephium Config changes
