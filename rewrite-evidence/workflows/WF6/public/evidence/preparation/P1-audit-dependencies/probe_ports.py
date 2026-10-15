"""Verify approved local socket capability only; no application server is started."""
import datetime as dt
import json
from pathlib import Path
import socket

def main():
    results=[]
    for port in (9006,9106,9107,9108):
        row=dict(host="127.0.0.1",port=port,reserved=False)
        try:
            with socket.socket() as sock:sock.bind(("127.0.0.1",port))
            row["bindable"]=True
        except OSError as exc:row.update(bindable=False,error=str(exc))
        results.append(row)
    roundtrip=False;error=None
    try:
        with socket.socket() as server:
            server.settimeout(3);server.bind(("127.0.0.1",0));server.listen(1)
            with socket.create_connection(server.getsockname(),timeout=3) as client:
                with server.accept()[0] as peer:
                    client.sendall(b"wf6-preparation");assert peer.recv(64)==b"wf6-preparation"
                    peer.sendall(b"ok");assert client.recv(8)==b"ok"
                    roundtrip=True
    except OSError as exc:error=str(exc)
    result=dict(timestamp=dt.datetime.now(dt.timezone.utc).isoformat(),probes=results,loopback_roundtrip=roundtrip,error=error,
        scope="Preparation socket capability only. Every socket closed; no application server, account or database initialized.")
    print(json.dumps(result,indent=2))
    raise SystemExit(0 if roundtrip and all(x["bindable"] for x in results) else 1)

if __name__=="__main__":main()
