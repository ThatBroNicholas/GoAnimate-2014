const fs = require("fs");
const path = require("path");
const folder = path.join(__dirname, "../", process.env.SAVED_FOLDER);
let baseDb;

module.exports = class GoDatabase {
	constructor(isSettings = false) {
		if (isSettings) {
			this.path = path.join(folder, "settings.json");
			baseDb = {
				DISCORD_RPC: false, // Shows your GA2014 activity on Discord.
				TRUNCATED_THEMELIST: true, // Don't mind this, this is used to get rid of the other themes
				SHOW_WAVEFORMS: true, // Forces waveforms to be off in the videomaker.
				DEFAULT_WATERMARK: "twoLines", // This is GoAnimate from 2014, what other GoAnimate watermark did you expect?
				IS_WIDE: "0", // Sets the video player to 14:9.
				SAVE_LOG_FILES: false, // what do you think
				HIDE_NAVBAR: true, // what do you think
			};
		} else {
			this.path = path.join(folder, "database.json");
			baseDb = { assets: [], movies: [] };
		}
		// create the file if it doesn't exist
		if (!fs.existsSync(this.path)) {
			console.error("Database doesn't exist! Creating...");
			this.save(baseDb);

			try {
				this.#refresh();
			} catch (e) {
				throw new Error("An error has occurred: Database failed to create a database. You might be in a read-only system, or an admin folder.");
			}
		}
		this.#refresh();
		if (Object.keys(this.json).length !== Object.keys(baseDb).length) {
			const newJson = baseDb;
			Object.assign(newJson, this.json);
			this.save(newJson);
		}
	}

	#refresh() { // refresh the database vars
		const data = fs.readFileSync(this.path);
		this.json = JSON.parse(data);
	}

	save(newData) {
		try {
			fs.writeFileSync(this.path, JSON.stringify(newData, null, "\t"));
			return true;
		} catch (err) {
			console.error("Error saving DB:", err);
			return false;
		}
	}

	/**
	 * deletes a field from the database
	 * @param {string} from category to select from
	 * @param {string} id id to look for
	 * @returns {boolean} did it work or not
	 */
	delete(from, id) {
		const index = this.get(from, id)?.index;
		if (typeof index == "undefined") return false;

		this.json[from].splice(index, 1);
		this.save(this.json);
		return true;
	}

	/**
	 * returns an object from the database
	 * @param {string} from category to select from
	 * @param {string} id id to look for
	 * @returns {{
	 * 	data: object,
	 * 	index: number
	 * } | false} returns object if it worked, false if it didn't
	 */
	get(from, id) {
		if (!from || !id) {
			throw new Error("Must input a category to select from or an ID to look for.");
		}

		this.#refresh();
		/** @type {Array} */
		const json = this.json[from];
		let index;

		const object = json.find((i, ind) => {
			if (i.id == id) {
				index = ind;
				return true;
			}
		});

		return object ? {
			data: object,
			index
		} : false;
	}

	/**
	 * Adds another field to the database.
	 * @param {string} from Category to insert into.
	 * @param {object} where Data to insert.
	 */
	insert(into, data) {
		this.#refresh();
		this.json[into].unshift(data);
		this.save(this.json);
	}

	/**
	 * Returns the database.
	 * @param {string} from Category to select from.
	 * @param {?object} where Parameters for each key.
	 * @returns {object}
	 */
	select(from, where) {
		this.#refresh();

		let json;
		if (from) {
			json = this.json[from];
			const filtered = json.filter((val) => {
				for (const [key, value] of Object.entries(where || {})) {
					if (val[key] && val[key] != value) {
						return false;
					}
				}
				return true;
			});
			return filtered;
		}
		return this.json;
	}

	/**
	 * Updates a field from the database.
	 * @param {string} from Category to select from.
	 * @param {string} id Id to look for.
	 * @param {object} data New data to save.
	 * @returns {boolean} did it work or not
	 */
	update(from, id, data) {
		if (!data) {
			throw new Error("Must input new data to save.");
		}

		const index = this.get(from, id)?.index;
		if (typeof index == "undefined") return false;

		Object.assign(this.json[from][index], data);
		this.save(this.json);
		return true;
	}
};
