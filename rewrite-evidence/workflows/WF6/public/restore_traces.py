#!/usr/bin/env python3
"""Restore selected, sanitized WF6 Playwright traces from shared gzip objects.
Uses only the Python standard library; never reads the original private workspace.
"""
from pathlib import Path, PurePosixPath
import argparse, gzip, hashlib, json, zipfile

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--list',action='store_true',help='List trace IDs and original evidence paths')
 parser.add_argument('--id',action='append',default=[],help='Restore this trace ID (repeatable)')
 parser.add_argument('--all',action='store_true',help='Restore every selected trace')
 parser.add_argument('--check-only',action='store_true',help='Verify every indexed object without writing ZIPs')
 parser.add_argument('--output',type=Path,default=Path('restored-traces'))
 args=parser.parse_args()
 root=Path(__file__).resolve().parent
 catalog=json.loads((root/'trace-catalog.json').read_text(encoding='utf-8'))
 if args.list:
  for row in catalog:print(row['id']+'  '+row['source'])
  return
 wanted={x['id'] for x in catalog} if args.all or args.check_only else set(args.id)
 if not wanted:parser.error('Choose --list, --id ID, --all, or --check-only')
 unknown=wanted-{x['id'] for x in catalog}
 if unknown:parser.error('Unknown trace IDs: '+', '.join(sorted(unknown)))
 checked=set();entries=0
 for row in catalog:
  if row['id'] not in wanted:continue
  index=json.loads((root/row['index']).read_text(encoding='utf-8'))
  destination=args.output/row['id']/'trace.zip'
  if not args.check_only:
   if destination.exists():raise FileExistsError(str(destination)+' already exists; use another --output directory')
   destination.parent.mkdir(parents=True,exist_ok=True)
  archive=None if args.check_only else zipfile.ZipFile(destination,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6)
  try:
   for entry in index['entries']:
    name=PurePosixPath(entry['name']);object_name=PurePosixPath(entry['object'])
    if name.is_absolute() or '..' in name.parts or object_name.is_absolute() or '..' in object_name.parts:raise ValueError('Unsafe entry path')
    data=gzip.decompress((root/entry['object']).read_bytes())
    if hashlib.sha256(data).hexdigest()!=entry['sha256'] or len(data)!=entry['bytes']:raise ValueError('Object integrity failure: '+entry['object'])
    checked.add(entry['sha256']);entries+=1
    if archive is not None:
     info=zipfile.ZipInfo(entry['name'],tuple(entry['date_time']));info.compress_type=zipfile.ZIP_DEFLATED
     archive.writestr(info,data)
  finally:
   if archive is not None:archive.close()
  if not args.check_only:print(str(destination))
 print(f'Verified {len(wanted)} traces, {entries} entries, {len(checked)} unique sanitized objects.')

if __name__=='__main__':main()