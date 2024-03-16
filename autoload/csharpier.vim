function! csharpier#formatfile(bufnr = v:null) abort
  call denops#plugin#wait_async('csharpier', { -> denops#notify('csharpier', 'format', [a:bufnr ?? bufnr()]) })
endfunction
