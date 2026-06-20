import { type Box, boxContains, boxIntersect } from "./box";
import {
  initialUpgrades,
  upgradeInfo,
  type Upgrade,
  type UpgradeType,
} from "./upgrades";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const restartBox: Box = {
  x: 0,
  y: -1,
  size: 1,
};

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
    size: 0.5,
    goalX,
    goalY,
    placed: false,
    color: "red",
  };
}

function inGoal(piece: Piece, goalSize: number) {
  return boxContains({ x: piece.goalX, y: piece.goalY, size: goalSize }, piece);
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
  } else if (game.state === "store") {
    for (let info of upgradeInfo) {
      if (boxContains(info, game.player)) {
        const next = nextUpgrade(game.upgrades, info.type);
        if (next !== null && game.bank >= next.price) {
          next.purchased = true;
          game.bank -= next.price;
        }
      }
    }
    if (boxContains(restartBox, game.player)) {
      restart();
    }
  }
}

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
  if (event.key === " ") {
    handleAction();
  } else if (event.key === "q") {
    reset();
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

  movementPositionToKeys(event);

  const click = {
    x: event.clientX,
    y: event.clientY,
    size: 1,
  };
  if (
    boxContains(
      {
        x: 0.5 * actionButtonSize + uiInset,
        y: window.innerHeight - 0.5 * actionButtonSize - uiInset,
        size: actionButtonSize,
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
      : { x: 0, y: 0, size: 0.2 }),
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
  console.log("restart");
  localStorage.removeItem("pieces");
  localStorage.removeItem("player");
  localStorage.removeItem("state");
  game = start();
}

function reset() {
  console.log("reset");
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
      JSON.stringify({ x: player.x, y: player.y, size: player.size }),
    );
    localStorage.setItem("upgrades", JSON.stringify(game.upgrades));
    localStorage.setItem("bank", JSON.stringify(game.bank));
    localStorage.setItem("state", JSON.stringify(game.state));
    lastSave = now;
  }

  if (keys.ArrowRight) {
    player.vx += dt * ACCEL;
  } else if (player.vx > 0) {
    player.vx -= dt * DECEL;
    player.vx = Math.max(player.vx, 0);
  }
  if (keys.ArrowLeft) {
    player.vx -= dt * ACCEL;
  } else if (player.vx < 0) {
    player.vx += dt * DECEL;
    player.vx = Math.min(player.vx, 0);
  }
  if (keys.ArrowUp) {
    player.vy -= dt * ACCEL;
  } else if (player.vy < 0) {
    player.vy += dt * DECEL;
    player.vy = Math.min(player.vy, 0);
  }
  if (keys.ArrowDown) {
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

  const w = window.innerWidth;
  const h = window.innerHeight;

  ctx.font = "14px Arial";

  ctx.clearRect(0, 0, w, h);

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
      (piece.x - player.x - 0.5 * piece.size) * zoom,
      (piece.y - player.y - 0.5 * piece.size) * zoom,
      piece.size * zoom,
      piece.size * zoom,
    );
    if (goalOnPiece > 0 && player.pieceHeld === piece) {
      const miniSize = piece.size / gridSize;
      ctx.fillStyle = "green";
      ctx.fillRect(
        (piece.x - player.x - 0.5 * piece.size + piece.goalX * miniSize) * zoom,
        (piece.y - player.y - 0.5 * piece.size + piece.goalY * miniSize) * zoom,
        miniSize * zoom,
        miniSize * zoom,
      );
    }
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      (piece.x - player.x - 0.5 * piece.size) * zoom,
      (piece.y - player.y - 0.5 * piece.size) * zoom,
      piece.size * zoom,
      piece.size * zoom,
    );
  }

  let storeMessage = "";
  if (game.state === "store") {
    storeMessage = renderStore(ctx);
  }

  ctx.fillStyle = "#4fc3f7";
  ctx.fillRect(
    -0.5 * player.size * zoom,
    -0.5 * player.size * zoom,
    player.size * zoom,
    player.size * zoom,
  );

  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ("← → ↑ ↓ ↖ ↗ ↘ ↙");

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
  ctx.fillText(`${game.bank}`, 5, 20);
  ctx.fillText("Arrows to move", 5, 40);
  ctx.fillText("Space/action to pick up, drop, buy", 5, 60);
  ctx.fillText("Q to reset the entire game", 5, 80);
  ctx.fillStyle = "#9f9";
  ctx.fillText(storeMessage, 5, 100);

  requestAnimationFrame(render);
}

function renderStore(ctx: CanvasRenderingContext2D): string {
  let message = "";
  upgradeInfo.map((info) => {
    const upgrade = nextUpgrade(game.upgrades, info.type);
    const enoughMoney = upgrade !== null && game.bank >= upgrade.price;
    const hover = boxContains(info, game.player);
    if (hover) {
      message = info.description;
    }
    ctx.fillStyle =
      upgrade === null || !enoughMoney ? "gray" : hover ? "#9f9" : "white";
    const insetSize = 0.9 * info.size;
    ctx.fillRect(
      (info.x - game.player.x - insetSize / 2) * zoom,
      (info.y - game.player.y - insetSize / 2) * zoom,
      insetSize * zoom,
      insetSize * zoom,
    );
    ctx.fillStyle = "black";
    ctx.fillText(
      info.name,
      (info.x - game.player.x) * zoom,
      (info.y - game.player.y) * zoom - 10,
    );
    ctx.fillText(
      upgrade ? `${upgrade.price}` : "Max",
      (info.x - game.player.x) * zoom,
      (info.y - game.player.y) * zoom + 10,
    );
  });
  const { x, y, size } = restartBox;
  const hover = boxContains(restartBox, game.player);
  ctx.fillStyle = hover ? "#9f9" : "white";
  const insetSize = 0.9 * size;
  ctx.fillRect(
    (x - game.player.x - insetSize / 2) * zoom,
    (y - game.player.y - insetSize / 2) * zoom,
    insetSize * zoom,
    insetSize * zoom,
  );
  ctx.fillStyle = "black";
  ctx.fillText("Start", (x - game.player.x) * zoom, (y - game.player.y) * zoom);
  return message;
}

requestAnimationFrame(render);
