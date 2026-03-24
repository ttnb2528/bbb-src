import React, { useEffect, useMemo } from "react";

import { UI_DATA_LISTENER_SUBSCRIBED } from "bigbluebutton-html-plugin-sdk/dist/cjs/ui-data/hooks/consts";
import { UserListUiDataPayloads } from "bigbluebutton-html-plugin-sdk/dist/cjs/ui-data/domain/user-list/types";
import * as PluginSdk from "bigbluebutton-html-plugin-sdk";
import { User } from "/imports/ui/Types/user";
import Styled from "./styles";
import Icon from "/imports/ui/components/common/icon/icon-ts/component";
import { defineMessages, useIntl } from "react-intl";

const intlMessages = defineMessages({
  searchUsersPlaceholder: {
    id: "app.userList.search",
    defaultMessage: "Search users...",
  },
});
import {
  USER_AGGREGATE_COUNT_SUBSCRIPTION,
  USER_SEARCH_AGGREGATE_COUNT_SUBSCRIPTION,
  UsersCountSubscriptionResponse,
} from "/imports/ui/core/graphql/queries/users";
import useDeduplicatedSubscription from "/imports/ui/core/hooks/useDeduplicatedSubscription";
import UserListParticipantsPageContainer from "./page/component";
import IntersectionWatcher from "./intersection-watcher/intersectionWatcher";
import { setLocalUserList } from "/imports/ui/core/hooks/useLoadedUserList";
import roveBuilder from "/imports/ui/core/utils/keyboardRove";

interface UserListParticipantsProps {
  count: number;
  searchTerm: string;
}

const UserListParticipants: React.FC<UserListParticipantsProps> = ({
  count,
  searchTerm,
}) => {
  const [visibleUsers, setVisibleUsers] = React.useState<{
    [key: number]: User[];
  }>({});
  const userListRef = React.useRef<HTMLUListElement | null>(null);
  const selectedUserRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    const keys = Object.keys(visibleUsers);
    if (keys.length > 0) {
      // eslint-disable-next-line
      const visibleUserArr = keys.sort().reduce((acc, key) => {
        return [
          ...acc,
          // @ts-ignore
          ...visibleUsers[key],
        ];
      }, [] as User[]);
      // eslint-disable-next-line
      setLocalUserList(visibleUserArr);
    }
  }, [visibleUsers]);

  const rove = useMemo(() => roveBuilder(selectedUserRef, "user-index"), []);

  // --- Plugin related code ---
  useEffect(() => {
    const updateUiDataHookUserListForPlugin = () => {
      window.dispatchEvent(
        new CustomEvent(PluginSdk.UserListUiDataNames.USER_LIST_IS_OPEN, {
          detail: {
            value: true,
          } as UserListUiDataPayloads[PluginSdk.UserListUiDataNames.USER_LIST_IS_OPEN],
        }),
      );
    };

    window.dispatchEvent(
      new CustomEvent(PluginSdk.UserListUiDataNames.USER_LIST_IS_OPEN, {
        detail: {
          value: true,
        } as UserListUiDataPayloads[PluginSdk.UserListUiDataNames.USER_LIST_IS_OPEN],
      }),
    );
    window.addEventListener(
      `${UI_DATA_LISTENER_SUBSCRIBED}-${PluginSdk.UserListUiDataNames.USER_LIST_IS_OPEN}`,
      updateUiDataHookUserListForPlugin,
    );
    return () => {
      window.removeEventListener(
        `${UI_DATA_LISTENER_SUBSCRIBED}-${PluginSdk.UserListUiDataNames.USER_LIST_IS_OPEN}`,
        updateUiDataHookUserListForPlugin,
      );
      window.dispatchEvent(
        new CustomEvent(PluginSdk.UserListUiDataNames.USER_LIST_IS_OPEN, {
          detail: {
            value: false,
          } as UserListUiDataPayloads[PluginSdk.UserListUiDataNames.USER_LIST_IS_OPEN],
        }),
      );
    };
  }, []);
  // --- End of plugin related code ---

  const amountOfPages = count === 0 ? 0 : Math.ceil(count / 50);
  return (
    <Styled.UserListColumn onKeyDown={rove} tabIndex={0} role="list">
      <Styled.VirtualizedList as="ul" ref={userListRef}>
        {Array.from({ length: amountOfPages }).map((_, i) => {
          const isLastItem = amountOfPages === i + 1;
          const restOfUsers = count % 50;
          const key = i;
          return i === 0 ? (
            <UserListParticipantsPageContainer
              key={key}
              index={i}
              isLastItem={isLastItem}
              restOfUsers={isLastItem ? restOfUsers : 50}
              setVisibleUsers={setVisibleUsers}
              searchTerm={searchTerm}
            />
          ) : (
            <IntersectionWatcher
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              ParentRef={userListRef}
              isLastItem={isLastItem}
              restOfUsers={isLastItem ? restOfUsers : 50}
            >
              <UserListParticipantsPageContainer
                key={key}
                index={i}
                isLastItem={isLastItem}
                restOfUsers={isLastItem ? restOfUsers : 50}
                setVisibleUsers={setVisibleUsers}
                searchTerm={searchTerm}
              />
            </IntersectionWatcher>
          );
        })}
      </Styled.VirtualizedList>
    </Styled.UserListColumn>
  );
};

const UserListParticipantsContainer: React.FC = () => {
  const intl = useIntl();
  const [inputValue, setInputValue] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  const isSearching = searchTerm.trim().length > 0;
  const activeSubscription = isSearching
    ? USER_SEARCH_AGGREGATE_COUNT_SUBSCRIPTION
    : USER_AGGREGATE_COUNT_SUBSCRIPTION;
  const options = isSearching
    ? { variables: { nameSearch: `%${searchTerm}%` } }
    : undefined;

  const { data: countData } =
    useDeduplicatedSubscription<UsersCountSubscriptionResponse>(
      activeSubscription,
      options,
    );
  const count = countData?.user_aggregate?.aggregate?.count || 0;

  return (
    <>
      <Styled.SearchWrapper>
        <Icon iconName="search" />
        <Styled.SearchInput
          type="text"
          placeholder={intl.formatMessage(intlMessages.searchUsersPlaceholder)}
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInputValue(e.target.value)
          }
        />
      </Styled.SearchWrapper>
      <UserListParticipants count={count ?? 0} searchTerm={searchTerm} />
    </>
  );
};

export default UserListParticipantsContainer;
