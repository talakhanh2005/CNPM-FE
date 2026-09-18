import { useState } from 'react';
import Button from './Button';

const JoinRoomInput = ({ onJoin }) => {
	const [roomCode, setRoomCode] = useState('');

	const handleSubmit = (event) => {
		event.preventDefault();
		const trimmedCode = roomCode.trim();

		if (!trimmedCode) return;
		onJoin?.(trimmedCode);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex h-[55px] w-full max-w-[435px] items-center rounded-[20px] bg-[#DDE3EA] px-4"
		>
			<img
				src="/keyboard.png"
				alt=""
				aria-hidden="true"
				className="mr-3 h-auto w-[8%] shrink-0 object-contain"
			/>

			<input
				type="text"
				value={roomCode}
				onChange={(event) => setRoomCode(event.target.value)}
				placeholder="Nhập mã phòng"
				aria-label="Mã phòng"
				className="min-w-0 flex-1 bg-transparent font-['Roboto'] text-[20px] text-black/60 outline-none placeholder:text-black/60"
			/>

			<Button
				type="default"
				htmlType="submit"
				disabled={!roomCode.trim()}
				className={`!h-[40px] !w-[100px] !shrink-0 !rounded-[20px] !px-3 !py-0 !font-['Roboto'] !text-[18px] !font-normal !leading-[20px] disabled:!cursor-not-allowed ${
					roomCode.trim()
						? '!bg-[#FFE9D6] !text-black/60 !opacity-100'
						: '!bg-[#C4BBB3] !text-black/40 !opacity-60'
				}`}
			>
				Tham gia
			</Button>
		</form>
	);
};

export default JoinRoomInput;
