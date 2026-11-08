path = "/etc/caddy/Caddyfile"
with open(path, "r") as f:
    c = f.read()

block = """    # NextGenGames Platform & Board Brawl (:3000)
    @nextgengames host nextgengames.gg www.nextgengames.gg
    handle @nextgengames {
        reverse_proxy 192.168.178.105:3000 {
            header_up Host {http.request.host}
            header_up X-Real-IP {http.request.remote.host}
            header_up X-Forwarded-Proto https
        }
    }

    # Base Fallback"""

if "@nextgengames" not in c:
    c = c.replace("    # Base Fallback", block)
    with open(path, "w") as f:
        f.write(c)
    print("SUCCESS: Caddyfile updated with nextgengames.gg block")
else:
    print("INFO: @nextgengames already in Caddyfile")
