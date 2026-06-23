import { type Box, boxContains, boxIntersect } from "./box";
import {
  initialUpgrades,
  upgradeInfo,
  type Upgrade,
  type UpgradeType,
} from "./upgrades";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

function resize() {
  const dpr = window.devicePixelRatio || 1;

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

type Piece = Box & {
  goalX: number;
  goalY: number;
  placed: boolean;
  color: string;
};

function generatePiece(gridSize: number, goalX: number, goalY: number): Piece {
  return {
    x: Math.random() * (gridSize - 1),
    y: Math.random() * (gridSize - 1),
    width: 0.5,
    height: 0.5,
    goalX,
    goalY,
    placed: false,
    color: "red",
  };
}

function inGoal(piece: Piece, goalSize: number) {
  return boxContains(
    { x: piece.goalX, y: piece.goalY, width: goalSize, height: goalSize },
    piece,
  );
}

function atGoal(piece: Piece) {
  return piece.x === piece.goalX && piece.y === piece.goalY;
}

function gridSizeReward(size: number) {
  return ((size - 1) * (size - 2)) / 2 + 2;
}

function maybeLockPiece(piece: Piece, goalSize: number, gridSize: number) {
  if (inGoal(piece, goalSize)) {
    piece.x = piece.goalX;
    piece.y = piece.goalY;
    game.bank += gridSizeReward(gridSize);
  }
}

function hoverPiece(): Piece | null {
  const { pieces, player } = game;
  for (let i = pieces.length - 1; i >= 0; i -= 1) {
    if (boxIntersect(player, pieces[i]) && !atGoal(pieces[i])) {
      return pieces[i];
    }
  }
  return null;
}

type Player = Box & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pieceHeld: Piece | null;
};

const keys: Record<string, boolean> = {};

function handleAction() {
  const { player } = game;
  if (game.state === "play") {
    const gridSize = upgradeValue(game.upgrades, "grid_size");
    if (player.pieceHeld !== null) {
      const goalSize = upgradeValue(game.upgrades, "goal_size");
      maybeLockPiece(player.pieceHeld, goalSize, gridSize);
      player.pieceHeld = null;
    } else {
      const piece = hoverPiece();
      if (piece) {
        player.pieceHeld = piece;
      }
    }
  }
}

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
  if (event.key === " ") {
    handleAction();
  } else if (event.key === "m") {
    game.bank += 1000;
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

window.addEventListener("blur", () => {
  for (const key in keys) {
    keys[key] = false;
  }
});

window.addEventListener("contextmenu", (e) => e.preventDefault());

function movementPositionToKeys(event: PointerEvent) {
  const centerX = window.innerWidth - 1.5 * arrowButtonSize - uiInset;
  const centerY = window.innerHeight - 1.5 * arrowButtonSize - uiInset;
  const dx = event.clientX - centerX;
  const dy = -(event.clientY - centerY);
  const angle = Math.atan2(dy, dx);
  const distance = Math.hypot(dx, dy);
  if (distance > 2 * arrowButtonSize) {
    return;
  }
  movementPointerId = event.pointerId;

  keys.ArrowUp = false;
  keys.ArrowDown = false;
  keys.ArrowLeft = false;
  keys.ArrowRight = false;
  if (angle >= Math.PI / 8 && angle <= (7 * Math.PI) / 8) {
    keys.ArrowUp = true;
  }
  if (angle >= (-7 * Math.PI) / 8 && angle <= -Math.PI / 8) {
    keys.ArrowDown = true;
  }
  if (angle >= (-3 * Math.PI) / 8 && angle <= (3 * Math.PI) / 8) {
    keys.ArrowRight = true;
  }
  if (angle >= (5 * Math.PI) / 8 || angle <= (-5 * Math.PI) / 8) {
    keys.ArrowLeft = true;
  }
}

window.addEventListener("pointerdown", (event) => {
  event.preventDefault();

  const click = {
    x: event.clientX,
    y: event.clientY,
    width: 1,
    height: 1,
  };
  if (game.state === "store") {
    const rect = {
      x: window.innerWidth / 2,
      y: uiInset + upgradeButtonHeight / 2,
      width: upgradeButtonWidth,
      height: upgradeButtonHeight,
    };
    if (boxContains(rect, click)) {
      reset();
    }
    rect.y += 1.1 * upgradeButtonHeight;
    rect.y += 1.1 * upgradeButtonHeight;
    upgradeInfo.map((info) => {
      if (boxContains(rect, click)) {
        const next = nextUpgrade(game.upgrades, info.type);
        if (next !== null && game.bank >= next.price) {
          next.purchased = true;
          game.bank -= next.price;
        }
      }
      rect.y += 1.1 * upgradeButtonHeight;
    });
    if (boxContains(rect, click)) {
      restart();
    }

    return;
  }

  movementPositionToKeys(event);

  if (
    boxContains(
      {
        x: window.innerWidth - 0.5 * arrowButtonSize - uiInset,
        y: 0.5 * arrowButtonSize + uiInset,
        width: arrowButtonSize,
        height: arrowButtonSize,
      },
      click,
    )
  ) {
    zoom *= 1.1;
  }
  if (
    boxContains(
      {
        x: window.innerWidth - 0.5 * arrowButtonSize - uiInset,
        y: 1.5 * arrowButtonSize + uiInset,
        width: arrowButtonSize,
        height: arrowButtonSize,
      },
      click,
    )
  ) {
    zoom /= 1.1;
  }
  if (
    boxContains(
      {
        x: 0.5 * actionButtonSize + uiInset,
        y: window.innerHeight - 0.5 * actionButtonSize - uiInset,
        width: actionButtonSize,
        height: actionButtonSize,
      },
      click,
    )
  ) {
    handleAction();
  }
});

function clearActionKeys(event: PointerEvent) {
  if (event.pointerId === movementPointerId) {
    keys.ArrowUp = false;
    keys.ArrowDown = false;
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    movementPointerId = null;
  }
}

window.addEventListener("pointermove", (event) => {
  if (event.pointerId === movementPointerId) {
    movementPositionToKeys(event);
  }
});

window.addEventListener("pointerup", clearActionKeys);
window.addEventListener("pointercancel", clearActionKeys);

let zoom = 100;
let uiInset = 25;
let arrowButtonSize = 50;
let actionButtonSize = 100;
let movementPointerId: number | null = null;
const ACCEL = 10;
const DECEL = 50;

function generatePieces(gridSize: number) {
  const pieces = [];
  for (var x = 0; x < gridSize; x += 1) {
    for (var y = 0; y < gridSize; y += 1) {
      pieces.push(generatePiece(gridSize, x, y));
    }
  }
  return pieces;
}

type GameState = "play" | "store";

type Game = {
  pieces: Piece[];
  player: Player;
  upgrades: Upgrade[];
  bank: number;
  state: GameState;
};

function start(): Game {
  const storageUpgrades = localStorage.getItem("upgrades");
  const upgrades: Upgrade[] =
    storageUpgrades !== null
      ? JSON.parse(storageUpgrades)
      : JSON.parse(JSON.stringify(initialUpgrades));
  const gridSize = upgradeValue(upgrades, "grid_size");

  const storagePieces = localStorage.getItem("pieces");
  const pieces: Piece[] =
    storagePieces !== null
      ? JSON.parse(storagePieces)
      : generatePieces(gridSize);

  const storagePlayer = localStorage.getItem("player");
  const player: Player = {
    ...(storagePlayer !== null
      ? (JSON.parse(storagePlayer) as Box)
      : { x: 0, y: 0, width: 0.2, height: 0.2 }),
    vx: 0,
    vy: 0,
    pieceHeld: null,
  };

  const storageBank = localStorage.getItem("bank");
  const bank: number = storageBank !== null ? JSON.parse(storageBank) : 0;

  const storageState = localStorage.getItem("state");
  const state: GameState =
    storageState !== null ? JSON.parse(storageState) : "play";

  return { pieces, player, upgrades, bank, state };
}

let game = start();

function restart() {
  localStorage.removeItem("pieces");
  localStorage.removeItem("player");
  localStorage.removeItem("state");
  game = start();
}

function reset() {
  localStorage.removeItem("pieces");
  localStorage.removeItem("player");
  localStorage.removeItem("state");
  localStorage.removeItem("upgrades");
  localStorage.removeItem("bank");
  game = start();
}

function upgradeValue(upgrades: Upgrade[], type: UpgradeType): number {
  const lastPurchased = upgrades.findLast(
    (upgrade) => upgrade.type === type && upgrade.purchased,
  );
  return lastPurchased === undefined ? 0 : lastPurchased.value;
}

function nextUpgrade(upgrades: Upgrade[], type: UpgradeType): Upgrade | null {
  const firstUnpurchased = upgrades.find(
    (upgrade) => upgrade.type === type && !upgrade.purchased,
  );
  return firstUnpurchased === undefined ? null : firstUnpurchased;
}

let lastTime = performance.now();
let lastSave = lastTime;
function render(now: number) {
  const gridSize = upgradeValue(game.upgrades, "grid_size");
  const win = game.pieces.every((piece) => atGoal(piece));
  if (win && game.state === "play") {
    // Bonus is one extra row
    const winBonus = gridSize * gridSizeReward(gridSize);
    game.bank += winBonus;
    game.state = "store";
  }

  let { player, pieces } = game;
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  const timeSinceLastSave = (now - lastSave) / 1000;
  if (timeSinceLastSave > 1) {
    localStorage.setItem("pieces", JSON.stringify(pieces));
    localStorage.setItem(
      "player",
      JSON.stringify({
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height,
      }),
    );
    localStorage.setItem("upgrades", JSON.stringify(game.upgrades));
    localStorage.setItem("bank", JSON.stringify(game.bank));
    localStorage.setItem("state", JSON.stringify(game.state));
    lastSave = now;
  }

  const w = window.innerWidth;
  const h = window.innerHeight;

  ctx.font = "14px Arial";

  ctx.clearRect(0, 0, w, h);

  if (game.state === "store") {
    renderStore(ctx);
    requestAnimationFrame(render);
    return;
  }

  if (keys.ArrowRight || keys.d) {
    player.vx += dt * ACCEL;
  } else if (player.vx > 0) {
    player.vx -= dt * DECEL;
    player.vx = Math.max(player.vx, 0);
  }
  if (keys.ArrowLeft || keys.a) {
    player.vx -= dt * ACCEL;
  } else if (player.vx < 0) {
    player.vx += dt * DECEL;
    player.vx = Math.min(player.vx, 0);
  }
  if (keys.ArrowUp || keys.w) {
    player.vy -= dt * ACCEL;
  } else if (player.vy < 0) {
    player.vy += dt * DECEL;
    player.vy = Math.min(player.vy, 0);
  }
  if (keys.ArrowDown || keys.s) {
    player.vy += dt * ACCEL;
  } else if (player.vy > 0) {
    player.vy -= dt * DECEL;
    player.vy = Math.max(player.vy, 0);
  }

  const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  const maxSpeed = upgradeValue(game.upgrades, "max_speed");
  if (speed > maxSpeed) {
    player.vx *= maxSpeed / speed;
    player.vy *= maxSpeed / speed;
  }

  player.x += player.vx * dt;
  player.y += player.vy * dt;
  if (player.pieceHeld !== null) {
    player.pieceHeld.x += player.vx * dt;
    player.pieceHeld.y += player.vy * dt;
  }

  if (game.state === "play" && upgradeValue(game.upgrades, "auto_pickup") > 0) {
    const pieceHover = hoverPiece();
    if (player.pieceHeld === null && pieceHover) {
      player.pieceHeld = pieceHover;
    }
  }
  const goalSize = upgradeValue(game.upgrades, "goal_size");
  if (game.state === "play" && upgradeValue(game.upgrades, "auto_drop") > 0) {
    if (player.pieceHeld !== null && inGoal(player.pieceHeld, goalSize)) {
      maybeLockPiece(player.pieceHeld, goalSize, gridSize);
      player.pieceHeld = null;
    }
  }

  const magnetSpeed = upgradeValue(game.upgrades, "magnet_speed");
  if (magnetSpeed > 0) {
    for (const piece of pieces) {
      if (piece !== player.pieceHeld && !inGoal(piece, goalSize)) {
        const dx = piece.goalX - piece.x;
        const dy = piece.goalY - piece.y;
        const len = Math.hypot(dx, dy);
        if (len > magnetSpeed * dt) {
          piece.x += (dx / len) * magnetSpeed * dt;
          piece.y += (dy / len) * magnetSpeed * dt;
        }
      }
    }
  }

  ctx.save();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.translate(w / 2, h / 2);

  const goalVisible = upgradeValue(game.upgrades, "goal_visible");
  if (goalVisible) {
    if (player.pieceHeld !== null) {
      ctx.fillStyle = "purple";
      ctx.fillRect(
        (player.pieceHeld.goalX - player.x - 0.5 * goalSize) * zoom,
        (player.pieceHeld.goalY - player.y - 0.5 * goalSize) * zoom,
        goalSize * zoom,
        goalSize * zoom,
      );
    }
  }

  ctx.fillStyle = "#444";
  for (var i = 0; i <= gridSize; i += 1) {
    ctx.fillRect(
      (i - player.x - 0.5) * zoom - 1.5,
      (0 - player.y - 0.5) * zoom,
      3,
      gridSize * zoom,
    );
    ctx.fillRect(
      (0 - player.x - 0.5) * zoom,
      (i - player.y - 0.5) * zoom - 1.5,
      gridSize * zoom,
      3,
    );
  }

  const goalOnPiece = upgradeValue(game.upgrades, "goal_on_piece");
  pieces.sort((a, b) => {
    if (atGoal(a)) {
      return -1;
    }
    if (atGoal(b)) {
      return 1;
    }
    if (a === player.pieceHeld) {
      return 1;
    }
    if (b === player.pieceHeld) {
      return -1;
    }
    if (a.goalX !== b.goalX) {
      return a.goalX - b.goalX;
    }
    return a.goalY - b.goalY;
  });
  for (let piece of pieces) {
    ctx.fillStyle = win
      ? "gold"
      : atGoal(piece)
        ? "green"
        : inGoal(piece, goalSize)
          ? "purple"
          : piece.color;
    ctx.fillRect(
      (piece.x - player.x - 0.5 * piece.width) * zoom,
      (piece.y - player.y - 0.5 * piece.height) * zoom,
      piece.width * zoom,
      piece.height * zoom,
    );
    if (goalOnPiece > 0 && player.pieceHeld === piece) {
      const miniWidth = piece.width / gridSize;
      const miniHeight = piece.height / gridSize;
      ctx.fillStyle = "green";
      ctx.fillRect(
        (piece.x - player.x - 0.5 * piece.width + piece.goalX * miniWidth) *
          zoom,
        (piece.y - player.y - 0.5 * piece.height + piece.goalY * miniHeight) *
          zoom,
        miniWidth * zoom,
        miniHeight * zoom,
      );
    }
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      (piece.x - player.x - 0.5 * piece.width) * zoom,
      (piece.y - player.y - 0.5 * piece.height) * zoom,
      piece.width * zoom,
      piece.height * zoom,
    );
  }

  ctx.fillStyle = "#4fc3f7";
  ctx.fillRect(
    -0.5 * player.width * zoom,
    -0.5 * player.height * zoom,
    player.width * zoom,
    player.height * zoom,
  );

  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(
    w - arrowButtonSize - uiInset,
    uiInset,
    arrowButtonSize,
    arrowButtonSize,
  );
  ctx.fillStyle = "black";
  ctx.fillText(
    "+",
    w - 0.5 * arrowButtonSize - uiInset,
    0.5 * arrowButtonSize + uiInset,
  );

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(
    w - arrowButtonSize - uiInset,
    arrowButtonSize + uiInset,
    arrowButtonSize,
    arrowButtonSize,
  );
  ctx.fillStyle = "black";
  ctx.fillText(
    "-",
    w - 0.5 * arrowButtonSize - uiInset,
    1.5 * arrowButtonSize + uiInset,
  );

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(
    w - 2 * arrowButtonSize - uiInset,
    h - 3 * arrowButtonSize - uiInset,
    arrowButtonSize,
    arrowButtonSize,
  );
  ctx.fillStyle = "black";
  ctx.fillText(
    "↑",
    w - 1.5 * arrowButtonSize - uiInset,
    h - 2.5 * arrowButtonSize - uiInset,
  );

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(
    w - 2 * arrowButtonSize - uiInset,
    h - arrowButtonSize - uiInset,
    arrowButtonSize,
    arrowButtonSize,
  );
  ctx.fillStyle = "black";
  ctx.fillText(
    "↓",
    w - 1.5 * arrowButtonSize - uiInset,
    h - 0.5 * arrowButtonSize - uiInset,
  );

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(
    w - 3 * arrowButtonSize - uiInset,
    h - 2 * arrowButtonSize - uiInset,
    arrowButtonSize,
    arrowButtonSize,
  );
  ctx.fillStyle = "black";
  ctx.fillText(
    "←",
    w - 2.5 * arrowButtonSize - uiInset,
    h - 1.5 * arrowButtonSize - uiInset,
  );

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(
    w - arrowButtonSize - uiInset,
    h - 2 * arrowButtonSize - uiInset,
    arrowButtonSize,
    arrowButtonSize,
  );
  ctx.fillStyle = "black";
  ctx.fillText(
    "→",
    w - 0.5 * arrowButtonSize - uiInset,
    h - 1.5 * arrowButtonSize - uiInset,
  );

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(
    uiInset,
    h - actionButtonSize - uiInset,
    actionButtonSize,
    actionButtonSize,
  );

  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "white";
  let lineY = 20;
  ctx.fillText(`Credits: ${game.bank}`, 5, lineY);
  lineY += 20;
  ctx.fillText("Sort the pieces into their places", 5, lineY);
  lineY += 20;
  ctx.fillText("Pieces turn purple in their target areas", 5, lineY);
  lineY += 20;
  ctx.fillText("Arrows to move", 5, lineY);
  lineY += 20;
  ctx.fillText("Space or action button to pick up, drop, buy", 5, lineY);

  requestAnimationFrame(render);
}

const upgradeButtonWidth = 200;
const upgradeButtonHeight = 50;

function renderStore(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const rect = {
    x: window.innerWidth / 2,
    y: uiInset + upgradeButtonHeight / 2,
    width: upgradeButtonWidth,
    height: upgradeButtonHeight,
  };
  ctx.fillStyle = "#f99";
  ctx.fillRect(
    rect.x - upgradeButtonWidth / 2,
    rect.y - upgradeButtonHeight / 2,
    rect.width,
    rect.height,
  );
  ctx.fillStyle = "black";
  ctx.fillText("End Game", rect.x, rect.y);
  rect.y += 1.1 * upgradeButtonHeight;
  ctx.fillStyle = "white";
  ctx.fillText(`Credits: ${game.bank}`, rect.x, rect.y);
  rect.y += 1.1 * upgradeButtonHeight;
  upgradeInfo.map((info) => {
    const upgrade = nextUpgrade(game.upgrades, info.type);
    const enoughMoney = upgrade !== null && game.bank >= upgrade.price;
    ctx.fillStyle = upgrade === null || !enoughMoney ? "gray" : "white";
    ctx.fillRect(
      rect.x - upgradeButtonWidth / 2,
      rect.y - upgradeButtonHeight / 2,
      rect.width,
      rect.height,
    );
    ctx.fillStyle = "black";
    ctx.fillText(info.name, rect.x, rect.y - 10);
    ctx.fillText(upgrade ? `${upgrade.price}` : "Max", rect.x, rect.y + 10);
    rect.y += 1.1 * upgradeButtonHeight;
  });
  ctx.fillStyle = "white";
  ctx.fillRect(
    rect.x - upgradeButtonWidth / 2,
    rect.y - upgradeButtonHeight / 2,
    rect.width,
    rect.height,
  );
  ctx.fillStyle = "black";
  ctx.fillText("Go", rect.x, rect.y);
}

requestAnimationFrame(render);
