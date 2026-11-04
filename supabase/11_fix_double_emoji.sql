-- Manual update tanpa regex — pakai exact match
update public.categories set name = 'PINDAH DANA' where name like '💸 PINDAH DANA' or name like '💸%PINDAH DANA%';
update public.categories set name = 'PEMASUKAN' where name like '💵 PEMASUKAN' or name like '💵%PEMASUKAN%';
update public.categories set name = 'TABUNGAN/ INVESTASI' where name like '💰 TABUNGAN/ INVESTASI' or name like '💰%TABUNGAN/ INVESTASI%';
update public.categories set name = 'KEBUTUHAN POKOK' where name like '🍚 KEBUTUHAN POKOK' or name like '🍚%KEBUTUHAN POKOK%';
update public.categories set name = 'TEMPAT TINGGAL' where name like '🏠 TEMPAT TINGGAL' or name like '🏠%TEMPAT TINGGAL%';
update public.categories set name = 'TRANSPORTASI' where name like '🚌 TRANSPORTASI' or name like '🚌%TRANSPORTASI%';
update public.categories set name = 'KESEHATAN' where name like '🩺 KESEHATAN' or name like '🩺%KESEHATAN%';
update public.categories set name = 'PERAWATAN DIRI' where name like '💇 PERAWATAN DIRI' or name like '💇%PERAWATAN DIRI%';
update public.categories set name = 'PENGEMBANGAN DIRI' where name like '📚 PENGEMBANGAN DIRI' or name like '📚%PENGEMBANGAN DIRI%';
update public.categories set name = 'GAYA HIDUP/ HIBURAN' where name like '🎉 GAYA HIDUP/ HIBURAN' or name like '🎉%GAYA HIDUP/ HIBURAN%';
update public.categories set name = 'HUTANG / CICILAN' where name like '💳 HUTANG / CICILAN' or name like '💳%HUTANG / CICILAN%';
update public.categories set name = 'LAIN-LAIN' where name like '⚠️ LAIN-LAIN' or name like '⚠️%LAIN-LAIN%';

-- Do the same for template_categories
update public.template_categories set name = 'PINDAH DANA' where name like '💸 PINDAH DANA' or name like '💸%PINDAH DANA%';
update public.template_categories set name = 'PEMASUKAN' where name like '💵 PEMASUKAN' or name like '💵%PEMASUKAN%';
update public.template_categories set name = 'TABUNGAN/ INVESTASI' where name like '💰 TABUNGAN/ INVESTASI' or name like '💰%TABUNGAN/ INVESTASI%';
update public.template_categories set name = 'KEBUTUHAN POKOK' where name like '🍚 KEBUTUHAN POKOK' or name like '🍚%KEBUTUHAN POKOK%';
update public.template_categories set name = 'TEMPAT TINGGAL' where name like '🏠 TEMPAT TINGGAL' or name like '🏠%TEMPAT TINGGAL%';
update public.template_categories set name = 'TRANSPORTASI' where name like '🚌 TRANSPORTASI' or name like '🚌%TRANSPORTASI%';
update public.template_categories set name = 'KESEHATAN' where name like '🩺 KESEHATAN' or name like '🩺%KESEHATAN%';
update public.template_categories set name = 'PERAWATAN DIRI' where name like '💇 PERAWATAN DIRI' or name like '💇%PERAWATAN DIRI%';
update public.template_categories set name = 'PENGEMBANGAN DIRI' where name like '📚 PENGEMBANGAN DIRI' or name like '📚%PENGEMBANGAN DIRI%';
update public.template_categories set name = 'GAYA HIDUP/ HIBURAN' where name like '🎉 GAYA HIDUP/ HIBURAN' or name like '🎉%GAYA HIDUP/ HIBURAN%';
update public.template_categories set name = 'HUTANG / CICILAN' where name like '💳 HUTANG / CICILAN' or name like '💳%HUTANG / CICILAN%';
update public.template_categories set name = 'LAIN-LAIN' where name like '⚠️ LAIN-LAIN' or name like '⚠️%LAIN-LAIN%';

-- Verify
(select 'user categories' as source, name, icon from public.categories order by sort_order limit 12)
union all
(select 'template categories', name, icon from public.template_categories order by sort_order limit 12);
