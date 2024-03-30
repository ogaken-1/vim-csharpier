function! csharpier#formatfile(bufnr = v:null) abort
  call denops#plugin#wait_async('csharpier', { -> denops#notify('csharpier', 'format', [a:bufnr ?? bufnr()]) })
endfunction

function! csharpier#formatfile_sync(bufnr = v:null) abort
  if denops#plugin#wait('csharpier')
    return
  endif
  call denops#request('csharpier', 'format', [a:bufnr ?? bufnr()])
endfunction
