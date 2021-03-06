import asyncio
import cogment

import cog_settings
from data_pb2 import (
    ClientAction,
    Message,
    TrialConfig,
)


async def client_actor_impl(actor_session):
    print("client actor started")
    actor_session.start()

    counter = 0

    async for event in actor_session.event_loop():
        if not (counter % 2):
            actor_session.send_message(
                Message(response=f"oh hai! {counter}"), ["echo_echo_1"]
            )
        if "observation" in event:
            observation = event["observation"]
            print(f"{actor_session.name} received observation {observation.request}")
            action = ClientAction(request=f"oh hai! {counter}")
            actor_session.do_action(action)
            counter += 1
        if "reward" in event:
            reward = event["reward"]
            print(
                f"'{actor_session.name}' received a reward for tick #{reward.tick_id}: {reward.value}/{reward.confidence}"
            )
        if "message" in event:
            (sender, message) = event["message"]
            print(
                f"'{actor_session.name}' received a message from '{sender}': - '{message}'"
            )
        if "final_data" in event:
            final_data = event["final_data"]
            for observation in final_data.observations:
                print(
                    f"'{actor_session.name}' received a final observation: '{observation}'"
                )
            for reward in final_data.rewards:
                print(
                    f"'{actor_session.name}' received a final reward for tick #{reward.tick_id}: {reward.value}/{reward.confidence}"
                )
            for message in final_data.messages:
                (sender, message) = message
                print(
                    f"'{actor_session.name}' received a final message from '{sender}': - '{message}'"
                )


async def main():
    print("Client starting...")

    trial_finished = asyncio.get_running_loop().create_future()
    context = cogment.Context(cog_settings=cog_settings, user_id="cogment-app")
    context.register_actor(
        impl=client_actor_impl,
        impl_name="client_actor_impl",
        actor_classes=[
            "client",
        ],
    )

    # Create and join a new trial
    trial_id = asyncio.get_running_loop().create_future()

    async def trial_controler(control_session):
        nonlocal trial_id
        print(f"Trial '{control_session.get_trial_id()}' starts")
        trial_id.set_result(control_session.get_trial_id())
        await trial_finished
        print(f"Trial '{control_session.get_trial_id()}' terminating")
        await control_session.terminate_trial()

    trial = asyncio.create_task(
        context.start_trial(
            endpoint=cogment.Endpoint("orchestrator:9000"),
            impl=trial_controler,
            trial_config=TrialConfig(),
        )
    )

    trial_id = await trial_id

    await context.join_trial(
        trial_id=trial_id,
        endpoint=cogment.Endpoint("orchestrator:9000"),
        impl_name="client_actor_impl",
    )

    await trial


if __name__ == "__main__":
    asyncio.run(main())
