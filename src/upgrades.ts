import { type Box } from "./box";

export type UpgradeType =
  | "max_speed"
  | "goal_size"
  | "goal_visible"
  | "grid_size"
  | "goal_on_piece"
  | "auto_pickup"
  | "auto_drop"
  | "magnet_speed";

export type UpgradeInfo = Box & {
  type: UpgradeType;
  name: string;
  description: string;
};

export const upgradeInfo: UpgradeInfo[] = [
  {
    type: "goal_on_piece",
    name: "Piece Target",
    description: "Shows the target location on the held piece",
    x: 0,
    y: -2,
    size: 1,
  },
  {
    type: "goal_visible",
    name: "Show Target",
    description: "Shows the target area of the held piece",
    x: -1,
    y: -2,
    size: 1,
  },
  {
    type: "max_speed",
    name: "Speed",
    description: "Increases movement speed",
    x: 1,
    y: -2,
    size: 1,
  },
  {
    type: "goal_size",
    name: "Target Size",
    description: "Increases target drop distance",
    x: 2,
    y: -2,
    size: 1,
  },
  {
    type: "grid_size",
    name: "Grid Size",
    description: "Increases grid size and increses reward for placing pieces",
    x: 3,
    y: -2,
    size: 1,
  },
  {
    type: "auto_pickup",
    name: "Auto Pickup",
    description: "Automatically picks up any piece you encounter",
    x: 4,
    y: -2,
    size: 1,
  },
  {
    type: "auto_drop",
    name: "Auto Drop",
    description: "Automatically drops piece at target",
    x: 5,
    y: -2,
    size: 1,
  },
  {
    type: "magnet_speed",
    name: "Magnet",
    description: "Increase pull on pieces toward target area",
    x: 6,
    y: -2,
    size: 1,
  },
];

export type Upgrade = {
  type: UpgradeType;
  price: number;
  value: number;
  purchased: boolean;
};

export const initialUpgrades: Upgrade[] = [
  {
    type: "goal_visible",
    price: 0,
    value: 0,
    purchased: true,
  },
  {
    type: "goal_visible",
    price: 500,
    value: 1,
    purchased: false,
  },
  {
    type: "goal_on_piece",
    price: 0,
    value: 0,
    purchased: true,
  },
  {
    type: "goal_on_piece",
    price: 100,
    value: 1,
    purchased: false,
  },
  {
    type: "max_speed",
    price: 0,
    value: 0.5,
    purchased: true,
  },
  {
    type: "max_speed",
    price: 10,
    value: 0.75,
    purchased: false,
  },
  {
    type: "max_speed",
    price: 20,
    value: 1,
    purchased: false,
  },
  {
    type: "max_speed",
    price: 50,
    value: 1.5,
    purchased: false,
  },
  {
    type: "max_speed",
    price: 100,
    value: 2,
    purchased: false,
  },
  {
    type: "max_speed",
    price: 200,
    value: 3,
    purchased: false,
  },
  {
    type: "max_speed",
    price: 400,
    value: 4,
    purchased: false,
  },
  {
    type: "max_speed",
    price: 800,
    value: 5,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 0,
    value: 1,
    purchased: true,
  },
  {
    type: "goal_size",
    price: 50,
    value: 1.2,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 100,
    value: 1.4,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 150,
    value: 1.6,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 200,
    value: 1.8,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 250,
    value: 2,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 500,
    value: 2.5,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 1000,
    value: 3,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 2000,
    value: 4,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 4000,
    value: 5,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 6000,
    value: 6,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 8000,
    value: 7,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 10000,
    value: 8,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 12000,
    value: 9,
    purchased: false,
  },
  {
    type: "goal_size",
    price: 14000,
    value: 10,
    purchased: false,
  },
  {
    type: "grid_size",
    price: 20,
    value: 2,
    purchased: true,
  },
  {
    type: "grid_size",
    price: 50,
    value: 3,
    purchased: false,
  },
  {
    type: "grid_size",
    price: 100,
    value: 4,
    purchased: false,
  },
  {
    type: "grid_size",
    price: 200,
    value: 5,
    purchased: false,
  },
  {
    type: "grid_size",
    price: 500,
    value: 6,
    purchased: false,
  },
  {
    type: "grid_size",
    price: 1000,
    value: 7,
    purchased: false,
  },
  {
    type: "grid_size",
    price: 2000,
    value: 8,
    purchased: false,
  },
  {
    type: "grid_size",
    price: 3000,
    value: 9,
    purchased: false,
  },
  {
    type: "grid_size",
    price: 5000,
    value: 10,
    purchased: false,
  },
  {
    type: "grid_size",
    price: 7000,
    value: 12,
    purchased: false,
  },
  {
    type: "grid_size",
    price: 9000,
    value: 14,
    purchased: false,
  },
  {
    type: "grid_size",
    price: 11000,
    value: 16,
    purchased: false,
  },
  {
    type: "auto_pickup",
    price: 0,
    value: 0,
    purchased: true,
  },
  {
    type: "auto_pickup",
    price: 1000,
    value: 1,
    purchased: false,
  },
  {
    type: "auto_drop",
    price: 0,
    value: 0,
    purchased: true,
  },
  {
    type: "auto_drop",
    price: 1000,
    value: 1,
    purchased: false,
  },
  {
    type: "magnet_speed",
    price: 0,
    value: 0,
    purchased: true,
  },
  {
    type: "magnet_speed",
    price: 2000,
    value: 0.05,
    purchased: false,
  },
  {
    type: "magnet_speed",
    price: 3000,
    value: 0.1,
    purchased: false,
  },
  {
    type: "magnet_speed",
    price: 5000,
    value: 0.2,
    purchased: false,
  },
  {
    type: "magnet_speed",
    price: 10000,
    value: 1,
    purchased: false,
  },
];
