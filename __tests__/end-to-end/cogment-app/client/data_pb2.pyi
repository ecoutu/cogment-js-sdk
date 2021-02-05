"""
@generated by mypy-protobuf.  Do not edit manually!
isort:skip_file
"""
import builtins
import google.protobuf.descriptor
import google.protobuf.message
import typing
import typing_extensions

DESCRIPTOR: google.protobuf.descriptor.FileDescriptor = ...

class EnvConfig(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor = ...

    def __init__(self,
        ) -> None: ...
global___EnvConfig = EnvConfig

class TrialConfig(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor = ...
    suffix: typing.Text = ...

    @property
    def env_config(self) -> global___EnvConfig: ...

    def __init__(self,
        *,
        env_config : typing.Optional[global___EnvConfig] = ...,
        suffix : typing.Text = ...,
        ) -> None: ...
    def HasField(self, field_name: typing_extensions.Literal[u"env_config",b"env_config"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing_extensions.Literal[u"env_config",b"env_config",u"suffix",b"suffix"]) -> None: ...
global___TrialConfig = TrialConfig

class Observation(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor = ...
    timestamp: builtins.int = ...
    request: typing.Text = ...
    response: typing.Text = ...

    def __init__(self,
        *,
        timestamp : builtins.int = ...,
        request : typing.Text = ...,
        response : typing.Text = ...,
        ) -> None: ...
    def ClearField(self, field_name: typing_extensions.Literal[u"request",b"request",u"response",b"response",u"timestamp",b"timestamp"]) -> None: ...
global___Observation = Observation

class ClientAction(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor = ...
    request: typing.Text = ...

    def __init__(self,
        *,
        request : typing.Text = ...,
        ) -> None: ...
    def ClearField(self, field_name: typing_extensions.Literal[u"request",b"request"]) -> None: ...
global___ClientAction = ClientAction

class EchoAction(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor = ...
    response: typing.Text = ...

    def __init__(self,
        *,
        response : typing.Text = ...,
        ) -> None: ...
    def ClearField(self, field_name: typing_extensions.Literal[u"response",b"response"]) -> None: ...
global___EchoAction = EchoAction

class ClientMessage(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor = ...
    request: typing.Text = ...

    def __init__(self,
        *,
        request : typing.Text = ...,
        ) -> None: ...
    def ClearField(self, field_name: typing_extensions.Literal[u"request",b"request"]) -> None: ...
global___ClientMessage = ClientMessage

class EchoMessage(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor = ...
    response: typing.Text = ...

    def __init__(self,
        *,
        response : typing.Text = ...,
        ) -> None: ...
    def ClearField(self, field_name: typing_extensions.Literal[u"response",b"response"]) -> None: ...
global___EchoMessage = EchoMessage
