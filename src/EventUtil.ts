import { TransportStream } from './TransportStream';

const sty = require('sty');

/**
 * Helper methods for colored output during input-events
 */
export class EventUtil {
	/**
	 * Generate a function for writing colored output to a socket
	 * @param {net.Socket} socket
	 * @return {function (string)}
	 */
	static genWrite(socket: TransportStream) {
		return (string: string) => socket.write(sty.parse(string));
	}

	/**
	 * Generate a function for writing colored output to a socket with a newline
	 * @param {net.Socket} socket
	 * @return {function (string)}
	 */
	static genSay(socket: TransportStream) {
		return (string: string) => socket.write(sty.parse(string + '\r\n'));
	}
}
