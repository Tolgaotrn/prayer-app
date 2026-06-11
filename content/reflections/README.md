# Reflections — General feed içeriği (özlü/manevi sözler)

General feed'inin mevcut verse/hadith/quote/dua karışımının yerini alacak **kısa, dini, özlü sözler** seçkisi. Feed'de **atıfsız** ("Reflection") gösterilir.

## Karar özeti
- **Ton:** Klasik tasavvuf/dini vecizeler (Yunus Emre, Mevlânâ, Cüneyd-i Bağdâdî vb.). Onaylandı.
- **Dini odak ŞART** — Allah, iman, kalp, tevekkül, tövbe, rahmet, ahiret. Genel motivasyon/aşk sözü değil.
- **Atıfsız** — General'da yazar gösterilmez.
- **Tüm diller** — her dile **o dilin kendi** vetli seti (çeviri değil; her dil kendi native özlü sözleri).
- **Hedef:** dil başına ~75-100 vetli satır.

## Pipeline
1. **Harvest** — toplayıcı sitelerden (neguzelsozler, menkibeler vb.) WebFetch ile çek → `<lang>.candidates.json`.
2. **Filtrele** — tek cümle, ≤120 karakter, çok satırlı şiirleri at.
3. **VET (kritik)** — her satır dini uygunluk için Tolga onayından geçer. Diğer dinlerin sembolü / şüpheli/yanlış atıflı söz ELENİR. Anonim+telifi belirsiz olanlar (`pd:false`) tercihen elenir veya açıkça onaylanır.
4. **Import** — onaylı satırlar `quotes` tablosuna `source_type='reflection'`, `author=null`, `topics=['Reflections']`; Arapça satırlar `quote_translations.language='ar'`.
5. **Feed** — `lib/contentDb.ts buildFeed`: bir dil için yeterli (≥~40) reflection varsa General'ı bunlarla doldur; yoksa **graceful** eski karışıma düş (General hiç boş kalmasın).

## Dosyalar
- `tr.candidates.json` — TR benchmark (vet bekliyor)
- (sonra) `en/fr/id/ar.candidates.json`

## Telif notu
Klasik isimler (≤19. yy) **kamu malı** → `pd:true`. Modern/anonim → `pd:false`, dikkatle değerlendir.
