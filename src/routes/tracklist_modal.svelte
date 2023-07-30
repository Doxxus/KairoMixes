<script lang="ts">
	export let show_tracklist: boolean; // boolean

	let dialog: HTMLDialogElement; // HTMLDialogElement

	$: if (dialog && show_tracklist) dialog.showModal();

	let hide_dialog: boolean;

	function CloseDialog() {
		hide_dialog = true;
		
		setTimeout(() => {
			dialog.close();
			hide_dialog = false;
		}, 300);
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => (show_tracklist = false)}
	on:click|self={() => CloseDialog()}

	class:hide={hide_dialog}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div on:click|stopPropagation>
		<slot name="header" />
		<hr />
		<slot name="track_content"/>
		<hr />
		<!-- svelte-ignore a11y-autofocus -->
		<button autofocus on:click={() => CloseDialog()}>Close</button>
	</div>
</dialog>

<style lang="scss">
	dialog {
        @apply dark:bg-dark-violet bg-translucent-violet;
        @apply dark:text-translucent-violet text-dark-violet;
      
        max-width: 32em;
		border-radius: 0.2em;
		border: none;
		padding: 0;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(2px);
	}

	dialog > div {
		padding: 1em;
	}


	dialog[open] {
		animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	dialog.hide {
		animation: zoomOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes zoomIn {
		from {
			opacity: 0;
			transform: scale(0.85);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes zoomOut {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(0.85);
		}
	}

	dialog[open]::backdrop {
		animation: fadeIn 0.3s ease-out;
	}

	dialog.hide::backdrop {
		animation: fadeOut 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	button {
		display: block;
	}
</style>