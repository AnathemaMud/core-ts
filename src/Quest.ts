import { EventEmitter } from 'events';
import { EntityReference } from './EntityReference';
import { IGameState } from './GameState';
import { Player } from './Player';
import { IQuestGoalDef, ISerializedQuestGoal, QuestGoal } from './QuestGoal';
import { IQuestRewardDef } from './QuestReward';

export interface IQuestDef {
	id: string;
	entityReference: EntityReference;
	title: string;
	description: string;
	completionMessage?: string;
	requires?: EntityReference[];
	level: number;
	autoComplete?: boolean;
	repeatable?: boolean;
	rewards: IQuestRewardDef[];
	goals: IQuestGoalDef[];
	anyOf?: IQuestGoalDef[];
	started?: number;
	npc?: string;
	receives?: string[];
}

export interface ISerializedQuestDef {
	state: ISerializedQuestGoal[];
	anyOf?: ISerializedQuestGoal[];
	progress: {
		percent: number;
		display: string;
	};
	config: {
		desc: string;
		level: number;
		title: string;
	};
}

/**
 * @property {object} config Default config for this quest, see individual quest types for details
 * @property {Player} player
 * @property {object} state  Current completion state
 * @extends EventEmitter
 */
export class Quest extends EventEmitter {
	id: string;
	entityReference: EntityReference;
	config: IQuestDef;
	player: Player;
	goals: QuestGoal[];
	anyOfGoals: QuestGoal[];
	state: Record<string, any> | ISerializedQuestDef[];
	GameState: IGameState;
	started?: string;

	constructor(
		GameState: IGameState,
		id: string,
		config: IQuestDef,
		player: Player
	) {
		super();

		this.id = id;
		this.entityReference = config.entityReference;
		this.config = Object.assign(
			{
				title: 'Missing Quest Title',
				description: 'Missing Quest Description',
				completionMessage: null,
				requires: [],
				level: 1,
				autoComplete: false,
				repeatable: false,
				rewards: [],
				goals: [],
			},
			config
		);

		this.player = player;
		this.goals = [];
		this.anyOfGoals = [];
		this.state = [];
		this.GameState = GameState;
	}

	/**
	 * Proxy all events to all the goals
	 * @param {string} event
	 * @param {...*}   args
	 */
	emit(event: string | symbol, ...args: any[]) {
		const result = super.emit(event, ...args);

		if (event === 'progress') {
			// don't proxy progress event
			return result;
		}

		this.goals.forEach((goal) => {
			goal.emit(event, ...args);
		});

		this.anyOfGoals.forEach((goal) => {
			goal.emit(event, ...args);
		});

		return result;
	}

	addGoal(goal: QuestGoal) {
		this.goals.push(goal);
		goal.on('progress', () => this.onProgressUpdated());
	}

	addAnyOfGoal(goal: QuestGoal) {
		this.anyOfGoals.push(goal);
		goal.on('progress', () => this.onProgressUpdated());
	}

	/**
	 * @fires Quest#turn-in-ready
	 * @fires Quest#progress
	 */
	onProgressUpdated() {
		const goalsDone = this.goals.length === 0 ||
			this.goals.every((g) => g.getProgress().percent >= 100);
		const anyOfDone = this.anyOfGoals.length === 0 ||
			this.anyOfGoals.some((g) => g.getProgress().percent >= 100);

		if (goalsDone && anyOfDone) {
			if (this.config.autoComplete) {
				this.complete();
			} else {
				/**
				 * @event Quest#turn-in-ready
				 */
				this.emit('turn-in-ready');
			}
			return;
		}

		/**
		 * @event Quest#progress
		 * @param {object} progress
		 */
		this.emit('progress', this.getProgress());
	}

	/**
	 * @return {{ percent: number, display: string }}
	 */
	getProgress() {
		const goalsPct = this.goals.length
			? this.goals.reduce((s, g) => s + g.getProgress().percent, 0) / this.goals.length
			: 100;

		const anyOfPct = this.anyOfGoals.length
			? Math.max(...this.anyOfGoals.map((g) => g.getProgress().percent))
			: 100;

		const totalWeight = (this.goals.length > 0 ? 1 : 0) + (this.anyOfGoals.length > 0 ? 1 : 0);
		const overall = totalWeight === 0
			? 100
			: totalWeight === 1
				? (this.goals.length > 0 ? goalsPct : anyOfPct)
				: (goalsPct + anyOfPct) / 2;

		const display = [
			...this.goals.map((g) => g.getProgress().display),
			...this.anyOfGoals.map((g) => g.getProgress().display),
		].filter(Boolean).join('\r\n');

		return {
			percent: Math.round(overall),
			display,
		};
	}

	/**
	 * Save the current state of the quest on player save
	 * @return {object}
	 */
	serialize(): ISerializedQuestDef {
		const serialized: ISerializedQuestDef = {
			state: this.goals.map((goal) => goal.serialize()),
			progress: this.getProgress(),
			config: {
				desc: this.config.description,
				level: this.config.level,
				title: this.config.title,
			},
		};

		if (this.anyOfGoals.length) {
			serialized.anyOf = this.anyOfGoals.map((goal) => goal.serialize());
		}

		return serialized;
	}

	hydrate() {
		const serializedState = this.state as ISerializedQuestDef;
		if (Array.isArray(serializedState)) {
			// legacy: state was an array of goal states
			(serializedState as unknown as ISerializedQuestGoal[]).forEach((goalState, i) => {
				if (!this.goals[i]) return;
				this.goals[i].hydrate(goalState.state);
			});
		} else {
			// new: state is ISerializedQuestDef with state and anyOf
			serializedState.state?.forEach((goalState, i) => {
				if (!this.goals[i]) return;
				this.goals[i].hydrate(goalState.state);
			});
			serializedState.anyOf?.forEach((goalState, i) => {
				if (!this.anyOfGoals[i]) return;
				this.anyOfGoals[i].hydrate(goalState.state);
			});
		}
	}

	/**
	 * @fires Quest#complete
	 */
	complete() {
		/**
		 * @event Quest#complete
		 */
		this.emit('complete');
		for (const goal of this.goals) {
			goal.complete();
		}
		for (const goal of this.anyOfGoals) {
			goal.complete();
		}
	}
}
