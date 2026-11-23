# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
"""Relatório do filme da abertura (tests/filmar_abertura.ps1): classifica cada foto e mede as fases.

Classes de cada foto (área abaixo da barra de título):
  fantasma         a janela ainda não está no tamanho e lugar finais (na tela ela aparece transparente, por cima do que está atrás)
  preta-com-branco borda escura e um retângulo claro no meio (a página ainda no tamanho antigo)
  preta            quase toda preta
  vazia            uma cor só (cinza, branca...), sem conteúdo
  esqueleto        o esqueleto da galeria (cartões claros, sem texto)
  conteudo         galeria, splash: algo desenhado

Uso: python tests/filmar_abertura_relatorio.py <pasta das cenas> <saída>
"""
import csv
import glob
import os
import re
import sys
from collections import Counter

from PIL import Image, ImageDraw, ImageStat

CENAS, SAIDA = sys.argv[1], sys.argv[2]
os.makedirs(SAIDA, exist_ok=True)


def classe(img, rect, final):
    if rect != final:
        return 'fantasma'
    w, h = img.size
    # miolo da janela: sem a barra de título e as bordas
    miolo = img.crop((int(w * .02), min(70, h // 6), int(w * .98), int(h * .97))).convert('L').resize((192, 108))
    hist = miolo.histogram()
    moda = max(range(256), key=lambda v: hist[v])
    fora = sum(n for v, n in enumerate(hist) if abs(v - moda) > 12) / (192 * 108)   # cartão branco (255) no fundo #e8 (232) conta
    total = 192 * 108
    escuro = sum(hist[:40]) / total
    claro = sum(hist[221:]) / total
    if escuro > .15 and claro > .15 and fora > .15:
        return 'preta-com-branco'
    if escuro > .9:
        return 'preta'
    # esqueleto (P-ABERTURA C): cartões claros (#f4 a #fb) no fundo #e8, sem texto nem desenho escuro abaixo do cabeçalho
    # (na resolução cheia: o texto pequeno dos cartões some quando a imagem é reduzida)
    corte = img.crop((int(w * .02), min(140, h // 4), int(w * .98), int(h * .97))).convert('L')
    baixo = corte.histogram()
    sem_escuro = sum(baixo[:150]) / (corte.size[0] * corte.size[1]) < .001
    leve = sum(n for v, n in enumerate(hist) if abs(v - moda) > 5) / total
    if sem_escuro and leve > .1:
        return 'esqueleto'
    if fora < .02:
        return 'vazia'
    return 'conteudo'


linhas = []
resumo = []
for cena in sorted(os.listdir(CENAS)):
    pasta = os.path.join(CENAS, cena)
    arq = os.path.join(pasta, 'janelas.csv')
    if not os.path.exists(arq):
        continue
    rows = list(csv.reader(open(arq, encoding='utf-8'), delimiter=';'))[1:]
    por = {}
    for r in rows:
        por.setdefault(int(r[0]), []).append(r)
    grandes = {q: [r for r in rs if r[3] == 'gizlivre' and r[5] == 'Tauri Window' and int(r[9]) > 50 and int(r[10]) > 50 and r[11] == '0'] for q, rs in por.items()}   # a lousa (não a tela de abertura)
    algum = {q: [r for r in rs if r[3] == 'gizlivre'] for q, rs in por.items()}
    fotos, splash = {}, {}
    for f in glob.glob(os.path.join(pasta, 'f*.jpg')):
        m = re.match(r'f(\d+)_(\d+)ms_a_(-?\d+)_(-?\d+)', os.path.basename(f))
        if m:   # a tela de abertura (P-ABERTURA B) e onde ela fica em relação à lousa
            splash[int(m.group(1))] = (f, int(m.group(3)), int(m.group(4)))
            continue
        m = re.match(r'f(\d+)_(\d+)ms', os.path.basename(f))
        fotos[int(m.group(1))] = (int(m.group(2)), f)
    qs = sorted(por)
    ms = {q: int(por[q][0][1]) for q in qs}
    ja_aberto = cena.startswith('c2')
    n0 = len(grandes[qs[0]]) if qs else 0
    # início: o processo aparece (janela invisível da instância única) ou, com o programa aberto, a nova janela grande
    if ja_aberto:
        inicio_q = next((q for q in qs if len(algum[q]) > len(algum[qs[0]])), None) or next((q for q in qs if len(grandes[q]) > n0), qs[0])
    else:
        inicio_q = next((q for q in qs if algum[q]), qs[0])
    t0 = ms[inicio_q]
    # tamanho e lugar finais: o retângulo mais comum da janela mais nova nas últimas fotos
    fim_rects = Counter(tuple(grandes[q][0][7:11]) for q in qs[-10:] if grandes[q])
    final = fim_rects.most_common(1)[0][0] if fim_rects else None
    seq = []
    for q in qs:
        if q >= inicio_q and q in splash and q not in fotos:
            seq.append((q, ms[q] - t0, 'abertura', None))
            continue
        if q < inicio_q or q not in fotos:
            continue
        if ja_aberto and len(grandes[q]) <= n0:
            continue
        rect = tuple(grandes[q][0][7:11]) if grandes[q] else None
        img = Image.open(fotos[q][1])
        if ja_aberto:
            # a nova janela cobre a antiga no mesmo lugar: a foto inteira é a nova
            rect = final
        c = classe(img, rect, final)
        if q in splash:
            c = 'abertura+' + c   # a lousa (o que aparece em volta) com a tela de abertura por cima
        seq.append((q, ms[q] - t0, c, fotos[q][1]))
    primeira_janela = seq[0][1] if seq else None
    pronta = None
    for i, (q, t, c, f) in enumerate(seq):
        if c == 'conteudo' and all(x[2] == 'conteudo' for x in seq[i:i + 3]):
            pronta = t
            break
    desenho = next((t for q, t, c, f in seq if c in ('esqueleto', 'conteudo') or c.startswith('abertura')), None)
    ruins = Counter(c for q, t, c, f in seq if pronta is None or t < pronta)
    dur = {}
    for i, (q, t, c, f) in enumerate(seq):
        if pronta is not None and t >= pronta:
            break
        prox = seq[i + 1][1] if i + 1 < len(seq) else t + 120
        dur[c] = dur.get(c, 0) + (prox - t)
    # do clique (hora gravada pelo roteiro) até o primeiro desenho do Giz na tela
    clique = None
    try:
        from datetime import datetime
        ini = datetime.fromisoformat(open(os.path.join(pasta, 'inicio.txt'), encoding='utf-8-sig').read().strip()[:26])
        cl = datetime.fromisoformat(open(os.path.join(pasta, 'clique.txt'), encoding='utf-8-sig').read().strip()[:26])
        clique = (cl - ini).total_seconds() * 1000
    except Exception:
        pass
    desde_clique = (t0 + desenho - clique) if (clique is not None and desenho is not None) else None
    linhas.append(f'== {cena}')
    if desde_clique is not None:
        linhas.append(f'  do clique ao primeiro desenho do Giz: {desde_clique / 1000:.2f} s')
    linhas.append(f'  primeira janela visível: +{primeira_janela / 1000:.2f} s' if primeira_janela is not None else '  nenhuma janela')
    linhas.append(f'  galeria (ou o que for o conteúdo) estável: +{pronta / 1000:.2f} s' if pronta is not None else '  conteúdo estável: não chegou')
    linhas.append(f'  primeiro desenho (tela de abertura, esqueleto ou galeria): +{desenho / 1000:.2f} s' if desenho is not None else '  primeiro desenho: nenhum')
    for c in ('fantasma', 'preta-com-branco', 'preta', 'vazia', 'esqueleto'):
        linhas.append(f'  {c:17s} {ruins.get(c, 0):3d} fotos, ~{dur.get(c, 0) / 1000:.2f} s')
    ab = sum(v for c, v in dur.items() if c.startswith('abertura'))
    if ab:
        linhas.append(f'  tela de abertura   ~{ab / 1000:.2f} s (em volta dela: ' + ', '.join(f'{c[9:] or "nada"} {v / 1000:.2f} s' for c, v in dur.items() if c.startswith('abertura')) + ')')
    ant = None
    for q, t, c, f in seq:
        if c != ant:
            linhas.append(f'    +{t / 1000:5.2f} s  {c}')
        ant = c
    resumo.append((cena, primeira_janela, pronta, dur, desenho, desde_clique))
    # linha do tempo: uma foto em cada mudança de classe (fantasma vira um quadro cinza)
    marcos, ant = [], None
    for q, t, c, f in seq:
        if c != ant:
            marcos.append((t, c, f, q))
        ant = c
    marcos = marcos[:8]
    if marcos:
        F = Image.new('RGB', (len(marcos) * 330, 214), '#777')
        for i, (t, c, f, q) in enumerate(marcos):
            cv = Image.new('RGB', (324, 208), 'white')
            if c.endswith('fantasma'):
                ImageDraw.Draw(cv).rectangle((0, 22, 324, 208), fill='#bbbbbb')
                ImageDraw.Draw(cv).text((90, 110), 'janela fantasma (pequena, fora do lugar)', fill='black')
            if f and not c.endswith('fantasma'):
                im = Image.open(f).convert('RGB')
            else:
                im = None
            if q in splash:
                # a tela de abertura por cima, no lugar dela (sem a lousa: no meio de um quadro cinza)
                sp, dx, dy = splash[q]
                si = Image.open(sp).convert('RGB')
                if im is None:
                    im = Image.new('RGB', (1920, 1040), '#9a9a9a')
                    dx, dy = (1920 - si.width) // 2, (1040 - si.height) // 2
                im.paste(si, (max(0, dx), max(0, dy)))
            if im is not None:
                im.thumbnail((324, 182))
                cv.paste(im, (0, 24))
            ImageDraw.Draw(cv).text((4, 6), f'+{t / 1000:.2f} s  {c}', fill='black')
            F.paste(cv, (i * 330, 3))
        F.save(os.path.join(SAIDA, f'linha-do-tempo-{cena}.png'))
    tf = os.path.join(pasta, 'tela-final.jpg')
    if os.path.exists(tf):
        im = Image.open(tf)
        im.thumbnail((1280, 720))
        im.save(os.path.join(SAIDA, f'{cena}-tela-final.png'))
    # a foto do conteúdo estável e uma de cada tela estranha que não seja fantasma
    vistas = set()
    for q, t, c, f in seq:
        if c in vistas or c.endswith('fantasma') or f is None:
            continue
        if c == 'conteudo' and (pronta is None or t < pronta):
            continue
        vistas.add(c)
        im = Image.open(f)
        im.thumbnail((1280, 720))
        im.save(os.path.join(SAIDA, f'{cena}-{c}.png'))

linhas.append('')
linhas.append('RESUMO (cena: primeira janela, primeiro desenho, galeria estável, telas estranhas antes dela)')
for cena, pj, pr, dur, de, dc in resumo:
    estranhas = ', '.join(f'{c} {v / 1000:.2f} s' for c, v in dur.items() if c not in ('conteudo', 'esqueleto') and not c.startswith('abertura')) or 'nenhuma'
    ab = sum(v for c, v in dur.items() if c.startswith('abertura'))
    if ab:
        estranhas += f'; tela de abertura {ab / 1000:.2f} s'
    esq = f'; esqueleto {dur["esqueleto"] / 1000:.2f} s' if dur.get('esqueleto') else ''
    cl = f'  clique->Giz {dc / 1000:.2f} s' if dc is not None else ''
    linhas.append(f'  {cena:20s} janela +{(pj or 0) / 1000:.2f} s  desenho +{(de if de is not None else 0) / 1000:.2f} s  galeria +{(pr or 0) / 1000:.2f} s{cl}  estranhas: {estranhas}{esq}')
open(os.path.join(SAIDA, 'relatorio.txt'), 'w', encoding='utf-8').write('\n'.join(linhas) + '\n')
print('\n'.join(linhas[-(len(resumo) + 1):]))
