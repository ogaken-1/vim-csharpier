function! csharpier#formatfile(bufnr = bufnr()) abort
  call denops#plugin#wait_async('csharpier', { -> denops#notify('csharpier', 'format', [a:bufnr]) })
endfunction

function! csharpier#formatfile_sync(bufnr = bufnr()) abort
  if denops#plugin#wait('csharpier')
    return
  endif
  call denops#request('csharpier', 'format', [a:bufnr])
endfunction
