if get(b:, 'did_csharpier_setup', v:false)
  finish
endif
let b:did_csharpier_setup = v:true

call denops#notify('csharpier', 'startServer', [])

augroup csharpier
  autocmd BufWritePre <buffer> call csharpier#formatfile_sync()
augroup END
