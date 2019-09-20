# Remote Machine Testing

If you're working in an environment where you have the need to run the server on
one machine (or VM) and need to test your app on another, you'll need to properly
configure both `webpack-hmr-client` and the remote machine. The most stable and
least error-prone method will involve setting options statically:

## Client Host and HOSTS

Update your HOSTS file with an entry akin to:

```
127.0.0.1   mytesthost    # where 127.0.0.1 is the IP of the machine hosting the tests
```

And modifying your options in a similar fashion:

```js
  host: {
    client: 'mytesthost',
    server: '0.0.0.0',
  }
```

### Use `public-ip`

If hostnames aren't your flavor, you can also use packages like
[`public-ip`](https://www.npmjs.com/package/public-ip) to set the host to your
machine's public IP address.

If the need to use `public-ip` in a synchronous environment arises, you might
look at using `public-ip-cli` in conjunction with `exceca.sync`:

```js
  const { stdout: ip } = execa.sync('public-ip', { preferLocal: true });
```

### The Wildcard Host `*`

New in v5.0.0 is the ability to set the `host.client` value to a wildcard symbol.
Setting the client property to `*` will tell the client scripts to connect to
any hostname the current page is being accessed on:

```js
host: {
  client: '*',
  server: '0.0.0.0',
}
```

This setting can create an environment of _unpredictable results_ in the
browser and is **unsupported**. Please make sure you know what you're doing if
using the wildcard option.