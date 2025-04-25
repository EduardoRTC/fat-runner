# Fat Runner – Pygame (v3.7 “ground-only” + repeated bosses + 20k difficulty boosts + áudio + SFX)
import os
import sys
import random
from dataclasses import dataclass
import pygame

# ─── INIT Pygame & CENTER WINDOW ──────────────────────────────────────── #
os.environ['SDL_VIDEO_CENTERED'] = '1'
pygame.init()
pygame.display.set_mode((1, 1))  # janela minúscula para permitir convert_alpha()

# ─── CONFIGURAÇÃO GERAL ────────────────────────────────────────────────── #
CFG = {
    "scr": {"w": 960, "h": 540, "ground": 100},
    "fps": 60,
    "grav": 0.6,
    "player": {
        "scale_min": 1.5, "scale_max": 2.8,
        "base_jump": -12, "jump_pen": 6,
        "hitbox_shrink": 0.3,
        "anim_t": 150, "speed": 6,
        "freeze_ms": 2000
    },
    "enemy": {
        "h_tgt": 70, "h_min": 55,
        "speed_base": 3, "speed_cap": 12,
        "hitbox_shrink": 0.4,
        "spawn_int": 1500, "min_int": 300,
        "scale": {"batata": 1.0, "coxinha": 1.3, "pizza": 1.5, "refri": 1.2},
        "slow": {"dur": 2000, "factor": 0.1}
    },
    "boss": {
        "speed": 5,
        "cap": 15,
        "inc_per_10k": 1,
        "hp": 3,
        "size": (100, 100),
        "spawn_dist": 20000
    },
    "pw": {
        "size": (80, 80), "int": 6000, "chance": 0.4,
        "items": {"agua": 10, "suco": 15}
    },
    "world": {
        "spd": 200, "spd2": 260, "parallax": 0.5
    },
    "road": {
        "col": (40, 40, 40), "stripe": (255, 215, 0),
        "w": 40, "gap": 60
    },
    "wt": {
        "start": 115, "max": 160, "min": 70,
        "loss_dx": 0.02, "loss_run": 0.005,
        "gain_e": 10, "gain_b": 18
    },
    "boost": {
        "dist": 20000,
        "spawn_mult": 0.95,
        "diff_add": 0.05
    },
    "audio": {
        "menu_file": "menu.mp3",
        "menu_vol": 0.5,
        "ingame_file": "ingame.mp3",
        "ingame_vol": 0.4,
        "ingame_fadein": 2000,
        "sfx": {
            "jump": "pular.mp3",
            "eat": "comendo.mp3",
            "powerup": "powerup.mp3",
            "gameover": "gameover.mp3"
        },
        "sfx_vol": 0.7
    }
}

# ─── DERIVADAS ────────────────────────────────────────────────────────────── #
W, H       = CFG["scr"]["w"], CFG["scr"]["h"]
GROUND_Y   = H - CFG["scr"]["ground"]
FPS        = CFG["fps"]
GRAVITY    = CFG["grav"]
ASSET_DIR  = os.path.dirname(os.path.abspath(__file__))

# ─── UTIL CARREGAR IMAGEM ────────────────────────────────────────────────── #
def img(name, size=None):
    path = os.path.join(ASSET_DIR, name)
    if os.path.isfile(path):
        surf = pygame.image.load(path).convert_alpha()
    else:
        surf = pygame.Surface((40, 40), pygame.SRCALPHA)
        surf.fill((255, 0, 255))
    if size:
        surf = pygame.transform.smoothscale(surf, size)
    return surf

# ─── PLAYER ────────────────────────────────────────────────────────────────── #
class Player(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.raw = {
            "idle": [img("Idle 001.png"), img("Idle 002.png")],
            "run":  [img("Walking-Running 001.png"), img("Walking-Running 002.png")],
            "jump": [img("Jumping 001.png")]
        }
        self.state     = "idle"
        self.weight    = CFG["wt"]["start"]
        self.dist_px   = 0
        self.image     = self.raw["idle"][0]
        self.rect      = self.image.get_rect(midbottom=(W//4, GROUND_Y))
        self._update_hitbox()
        self.vy        = 0
        self.on_ground = True
        self.anim_t    = 0
        self.anim_i    = 0
        self.anim_ref  = id(self.raw["idle"])
        self.freeze_ms = 0
        self.slow_ms   = 0

    def _update_hitbox(self):
        ws = self.rect.w * CFG["player"]["hitbox_shrink"]
        hs = self.rect.h * CFG["player"]["hitbox_shrink"]
        self.hitbox = pygame.Rect(
            self.rect.left + ws/2,
            self.rect.top  + hs,
            self.rect.w    - ws,
            self.rect.h    - hs
        )

    def _scale(self):
        t = (self.weight - CFG["wt"]["min"]) / (CFG["wt"]["max"] - CFG["wt"]["min"])
        t = max(0, min(1, t))
        return CFG["player"]["scale_min"] + t*(CFG["player"]["scale_max"]-CFG["player"]["scale_min"])

    def _frames(self):
        sc = self._scale()
        return [pygame.transform.smoothscale(
                    f, (int(f.get_width()*sc), int(f.get_height()*sc)))
                for f in self.raw[self.state]]

    def update(self, dt, world_px):
        if self.freeze_ms>0: self.freeze_ms = max(0, self.freeze_ms - dt)
        if self.slow_ms>0:   self.slow_ms   = max(0, self.slow_ms   - dt)

        keys   = pygame.key.get_pressed()
        frozen = (self.freeze_ms>0)
        slowed = (self.slow_ms>0)
        spd    = CFG["player"]["speed"] * (CFG["enemy"]["slow"]["factor"] if slowed else 1)

        dx = 0
        if not frozen:
            if keys[pygame.K_LEFT] or keys[pygame.K_a]:
                dx -= spd
            if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
                dx += spd

        if dx:
            self.rect.x = max(0, min(W-self.rect.w, self.rect.x+dx))
            self.weight = max(CFG["wt"]["min"],
                self.weight - abs(dx)*CFG["wt"]["loss_dx"]
            )

        self.weight = max(CFG["wt"]["min"],
            self.weight - world_px*CFG["wt"]["loss_run"]
        )

        # pular
        if (not frozen and
            (keys[pygame.K_SPACE] or keys[pygame.K_UP] or keys[pygame.K_w]) and
            self.on_ground):
            factor = (self.weight - CFG["wt"]["min"]) / (CFG["wt"]["max"] - CFG["wt"]["min"])
            self.vy = CFG["player"]["base_jump"] + CFG["player"]["jump_pen"]*factor
            self.on_ground = False
            # toca SFX de pulo
            pygame.mixer.Sound.play(JUMP_SFX)

        self.vy += GRAVITY
        self.rect.y += self.vy
        if self.rect.bottom >= GROUND_Y:
            self.rect.bottom = GROUND_Y
            self.vy = 0
            self.on_ground = True

        self.state = "jump" if not self.on_ground else "run" if dx else "idle"
        frames = self._frames()
        if id(self.raw[self.state]) != self.anim_ref:
            self.anim_i   = 0
            self.anim_ref = id(self.raw[self.state])
        self.anim_t += dt
        if self.anim_t > CFG["player"]["anim_t"]:
            self.anim_t = 0
            self.anim_i = (self.anim_i + 1) % len(frames)

        mid, bot = self.rect.centerx, self.rect.bottom
        self.image = frames[self.anim_i]
        self.rect  = self.image.get_rect(midbottom=(mid, bot))
        self._update_hitbox()

        self.dist_px += world_px

# ─── ENEMY ────────────────────────────────────────────────────────────────── #
SPRITES = {
    "batata": "batata.png",
    "coxinha":"coxinha.png",
    "pizza":  "pizza.png",
    "refri":  "refri.png"
}

class Enemy(pygame.sprite.Sprite):
    def __init__(self, kind, diff):
        super().__init__()
        self.kind = kind
        im = img(SPRITES[kind])
        h  = im.get_height()
        tgt= CFG["enemy"]["h_tgt"]
        mn = CFG["enemy"]["h_min"]
        if h > tgt:
            s = tgt/h
            im = pygame.transform.smoothscale(im,(int(im.get_width()*s), tgt))
        elif h < mn:
            s = mn/h
            im = pygame.transform.smoothscale(im,(int(im.get_width()*s), mn))
        self.image = im
        self.rect  = im.get_rect(midbottom=(W+im.get_width(), GROUND_Y))
        ws     = self.rect.w * CFG["enemy"]["hitbox_shrink"]
        height = self.rect.h * (1 - CFG["enemy"]["hitbox_shrink"])
        self.hitbox = pygame.Rect(
            self.rect.left + ws/2,
            self.rect.bottom - height,
            self.rect.w - ws,
            height
        )
        base_speed = CFG["enemy"]["speed_base"] * CFG["enemy"]["scale"][kind] * diff
        self.speed  = min(base_speed, CFG["enemy"]["speed_cap"])

    def update(self, dt, world_px):
        self.rect.x -= self.speed + world_px
        ws = self.rect.w * CFG["enemy"]["hitbox_shrink"]
        self.hitbox.x      = self.rect.left + ws/2
        self.hitbox.bottom = self.rect.bottom
        if self.rect.right < 0:
            self.kill()

# ─── POWERUP ────────────────────────────────────────────────────────────── #
class PowerUp(pygame.sprite.Sprite):
    def __init__(self, kind):
        super().__init__()
        self.kind  = kind
        self.image = img(f"{kind}.png", CFG["pw"]["size"])
        self.rect  = self.image.get_rect(
            midbottom=(W+30, GROUND_Y - random.randint(0,120))
        )
        self.speed = CFG["enemy"]["speed_base"] * 0.8

    def update(self, dt, world_px):
        self.rect.x -= self.speed + world_px
        if self.rect.right < 0:
            self.kill()

# ─── BOSS ────────────────────────────────────────────────────────────────── #
class Boss(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.image = img("coxinha.png", CFG["boss"]["size"])
        self.rect  = self.image.get_rect(midbottom=(W+100, GROUND_Y))
        self.vx    = CFG["boss"]["speed"]
        self.hp    = CFG["boss"]["hp"]

    def update(self, dt, world_px):
        self.rect.x += self.vx - world_px
        if self.rect.left <= 0:
            self.rect.left = 0
            self.vx = abs(self.vx)
        elif self.rect.right >= W:
            self.rect.right = W
            self.vx = -abs(self.vx)

@dataclass
class Timers:
    enemy: int = 0
    power: int = 0

# ─── CARREGA SFX ─────────────────────────────────────────────────────────── #
JUMP_SFX     = pygame.mixer.Sound(os.path.join(ASSET_DIR, CFG["audio"]["sfx"]["jump"]))
EAT_SFX      = pygame.mixer.Sound(os.path.join(ASSET_DIR, CFG["audio"]["sfx"]["eat"]))
POWERUP_SFX  = pygame.mixer.Sound(os.path.join(ASSET_DIR, CFG["audio"]["sfx"]["powerup"]))
GAMEOVER_SFX = pygame.mixer.Sound(os.path.join(ASSET_DIR, CFG["audio"]["sfx"]["gameover"]))
for s in (JUMP_SFX, EAT_SFX, POWERUP_SFX, GAMEOVER_SFX):
    s.set_volume(CFG["audio"]["sfx_vol"])

# ─── GAME + MENU + ÁUDIO ─────────────────────────────────────────────────── #
class Game:
    def __init__(self):
        self.screen    = pygame.display.set_mode((W, H))
        pygame.display.set_caption("Fat Runner")
        self.clock     = pygame.time.Clock()
        self.font_main = pygame.font.SysFont("consolas", 36)
        self.font_hud  = pygame.font.SysFont("consolas", 24)

        bg_orig = img("background.png")
        h, wbg  = H, int(bg_orig.get_width()*H/bg_orig.get_height())
        blur    = pygame.transform.smoothscale(bg_orig,(wbg//2, h//2))
        blur    = pygame.transform.smoothscale(blur,(wbg, h))
        self.bg  = blur
        self.bx1, self.bx2 = 0, wbg

        small        = pygame.transform.smoothscale(bg_orig,(W//10,H//10))
        self.menu_bg = pygame.transform.smoothscale(small,(W,H))

        self.all  = pygame.sprite.Group()
        self.en   = pygame.sprite.Group()
        self.pw   = pygame.sprite.Group()
        self.bs   = pygame.sprite.Group()

        self.btn_play = pygame.Rect(W//2-120, H//2-40, 240,60)
        self.btn_exit = pygame.Rect(W//2-120, H//2+40, 240,60)

        self.state     = "menu"
        self.next_boss  = CFG["boss"]["spawn_dist"]
        self.next_boost = CFG["boost"]["dist"]

        # música de menu
        pygame.mixer.music.load(CFG["audio"]["menu_file"])
        pygame.mixer.music.set_volume(CFG["audio"]["menu_vol"])
        pygame.mixer.music.play(-1)

    def reset(self):
        self.all.empty(); self.en.empty(); self.pw.empty(); self.bs.empty()
        self.player     = Player(); self.all.add(self.player)
        self.timers     = Timers()
        self.spawn_int  = CFG["enemy"]["spawn_int"]
        self.diff       = 1.0
        self.ws         = CFG["world"]["spd"]
        self.next_boss  = CFG["boss"]["spawn_dist"]
        self.next_boost = CFG["boost"]["dist"]
        self.road_off   = 0
        self.state      = "play"
        # troca trilha para ingame com fade-in
        pygame.mixer.music.fadeout(1000)
        pygame.mixer.music.load(CFG["audio"]["ingame_file"])
        pygame.mixer.music.set_volume(CFG["audio"]["ingame_vol"])
        pygame.mixer.music.play(-1, fade_ms=CFG["audio"]["ingame_fadein"])

    def handle_click(self, pos):
        if self.state in ("menu","gameover"):
            if self.btn_play.collidepoint(pos):
                self.reset()
            elif self.btn_exit.collidepoint(pos):
                pygame.quit(); sys.exit()

    def loop(self):
        while True:
            dt = self.clock.tick(FPS)
            for ev in pygame.event.get():
                if ev.type==pygame.QUIT or (ev.type==pygame.KEYDOWN and ev.key==pygame.K_ESCAPE):
                    pygame.quit(); sys.exit()
                if ev.type==pygame.MOUSEBUTTONDOWN and ev.button==1:
                    self.handle_click(ev.pos)
            self.update(dt)
            self.draw()

    def update(self, dt):
        if self.state=="play":
            wp = self.ws * dt/1000.0

            # boost a cada 20k
            if self.player.dist_px >= self.next_boost:
                self.spawn_int = max(CFG["enemy"]["min_int"],
                                     int(self.spawn_int*CFG["boost"]["spawn_mult"]))
                self.diff       += CFG["boost"]["diff_add"]
                self.next_boost += CFG["boost"]["dist"]

            # spawns
            self.timers.enemy += dt; self.timers.power += dt
            if self.timers.enemy >= self.spawn_int:
                self.timers.enemy=0; self.spawn_enemy()
            if self.timers.power >= CFG["pw"]["int"]:
                self.timers.power=0
                if random.random() < CFG["pw"]["chance"]:
                    self.spawn_power()

            # boss a cada 20k (se não ativo)
            if self.player.dist_px >= self.next_boss and len(self.bs)==0:
                self.spawn_boss(); self.next_boss += CFG["boss"]["spawn_dist"]

            # atualiza sprites
            self.player.update(dt, wp)
            for s in list(self.en): s.update(dt, wp)
            for p in list(self.pw): p.update(dt, wp)
            for b in list(self.bs): b.update(dt, wp)

            # ajusta velocidade do boss
            lvl = int(self.player.dist_px//10000)
            for b in self.bs:
                mag = min(CFG["boss"]["cap"],
                          CFG["boss"]["speed"] + lvl*CFG["boss"]["inc_per_10k"])
                b.vx = mag if b.vx>0 else -mag

            # colisões inimigos
            for e in list(self.en):
                if self.player.hitbox.colliderect(e.hitbox):
                    self.player.weight += CFG["wt"]["gain_e"]
                    pygame.mixer.Sound.play(EAT_SFX)
                    if e.kind=="refri":
                        self.player.freeze_ms = CFG["player"]["freeze_ms"]
                    if e.kind=="coxinha":
                        self.player.slow_ms   = CFG["enemy"]["slow"]["dur"]
                    e.kill()

            # colisões powerups
            for p in list(self.pw):
                if self.player.hitbox.colliderect(p.rect):
                    self.player.weight = max(CFG["wt"]["min"],
                                             self.player.weight - CFG["pw"]["items"][p.kind])
                    pygame.mixer.Sound.play(POWERUP_SFX)
                    p.kill()

            # colisões boss
            for b in list(self.bs):
                if self.player.hitbox.colliderect(b.rect):
                    if (self.player.vy>0 and
                        self.player.hitbox.bottom <= b.rect.top+10):
                        b.hp -= 1
                        self.player.vy = CFG["player"]["base_jump"] * 0.8
                        if b.hp <= 0:
                            b.kill()
                            self.ws = CFG["world"]["spd2"]
                    else:
                        new_w = self.player.weight * 1.33
                        self.player.weight = min(CFG["wt"]["max"], new_w)

            # game over
            if self.player.weight >= CFG["wt"]["max"]:
                self.state = "gameover"
                # parar música e tocar SFX gameover
                pygame.mixer.music.stop()
                pygame.mixer.Sound.play(GAMEOVER_SFX)

    def spawn_enemy(self):
        kind = random.choice(list(SPRITES.keys()))
        e    = Enemy(kind, self.diff)
        self.en.add(e); self.all.add(e)

    def spawn_power(self):
        kind = random.choice(list(CFG["pw"]["items"].keys()))
        p    = PowerUp(kind)
        self.pw.add(p); self.all.add(p)

    def spawn_boss(self):
        b = Boss()
        self.bs.add(b); self.all.add(b)

    def draw(self):
        self.screen = pygame.display.get_surface()
        if self.state == "menu":
            self.screen.blit(self.menu_bg, (0,0))
            title = self.font_main.render("FAT RUNNER", True, (255,255,255))
            self.screen.blit(title, title.get_rect(center=(W//2,H//2-100)))
            pygame.draw.rect(self.screen,(0,200,0), self.btn_play)
            pygame.draw.rect(self.screen,(200,0,0), self.btn_exit)
            self.screen.blit(self.font_main.render("JOGAR",True,(0,0,0)),
                             self.btn_play.move(60,10))
            self.screen.blit(self.font_main.render("SAIR",True,(0,0,0)),
                             self.btn_exit.move(80,10))
        elif self.state == "play":
            wp = self.ws * self.clock.get_time()/1000.0
            mv = wp * CFG["world"]["parallax"]
            self.bx1 -= mv; self.bx2 -= mv
            wbg = self.bg.get_width()
            if self.bx1 <= -wbg: self.bx1 = self.bx2 + wbg
            if self.bx2 <= -wbg: self.bx2 = self.bx1 + wbg
            self.screen.blit(self.bg, (self.bx1,0))
            self.screen.blit(self.bg, (self.bx2,0))
            pygame.draw.rect(self.screen, CFG["road"]["col"],
                             (0,GROUND_Y, W, H-GROUND_Y))
            self.road_off = getattr(self,"road_off",0) + mv
            self.road_off %= (CFG["road"]["w"] + CFG["road"]["gap"])
            x = -self.road_off
            while x < W:
                pygame.draw.rect(self.screen, CFG["road"]["stripe"],
                                 (x,GROUND_Y+20,
                                  CFG["road"]["w"], 10))
                x += CFG["road"]["w"] + CFG["road"]["gap"]
            self.all.draw(self.screen)
            # HUD
            bw,bh,hx,hy = 200,20,20,20
            pygame.draw.rect(self.screen,(70,70,70),(hx,hy,bw,bh))
            pct  = (self.player.weight - CFG["wt"]["min"]) / \
                   (CFG["wt"]["max"] - CFG["wt"]["min"])
            fill = int(bw * pct)
            col  = (0,200,0) if pct<0.6 else ((255,165,0) if pct<0.9 else (255,0,0))
            pygame.draw.rect(self.screen,col,(hx,hy,fill,bh))
            self.screen.blit(self.font_hud.render(
                f"Peso: {self.player.weight:.1f} kg",True,(255,255,255)),
                (hx,hy+bh+5))
            ds = self.font_hud.render(
                f"Distância: {int(self.player.dist_px)} px",True,(255,255,255))
            self.screen.blit(ds,(W-ds.get_width()-20,20))
            if self.player.freeze_ms > 0:
                fr = self.font_hud.render("CONGELADO!", True, (0,200,255))
                self.screen.blit(fr, fr.get_rect(center=(W//2,50)))
        else:  # gameover
            self.screen.fill((0,0,0))
            go = self.font_main.render("GAME OVER", True, (255,0,0))
            go = pygame.transform.scale(go,
                 (go.get_width()*2, go.get_height()*2))
            self.screen.blit(go, go.get_rect(center=(W//2,H//2-100)))
            pygame.draw.rect(self.screen,(0,200,0), self.btn_play)
            pygame.draw.rect(self.screen,(200,0,0), self.btn_exit)
            self.screen.blit(self.font_main.render("JOGAR NOVAMENTE",True,(0,0,0)),
                             self.btn_play.move(10,10))
            self.screen.blit(self.font_main.render("SAIR",True,(0,0,0)),
                             self.btn_exit.move(80,10))
        pygame.display.flip()

if __name__ == "__main__":
    Game().loop()
