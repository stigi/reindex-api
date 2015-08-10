import {Map} from 'immutable';
import {GraphQLString, GraphQLNonNull} from 'graphql';
import * as queries from '../../db/queries';
import ReindexID from '../builtins/ReindexID';
import createRootField from '../createRootField';

export default function createCRU(operation, getById, {
  type,
  inputObject,
  mutation,
}) {
  let opArgs = Map({
    clientMutationId: {
      name: 'clientMutationId',
      type: GraphQLString,
    },
    [type.name]: {
      name: type.name,
      type: new GraphQLNonNull(inputObject),
    },
  });

  if (getById) {
    opArgs = opArgs.set('id', {
      name: 'id',
      type: new GraphQLNonNull(ReindexID),
    });
  }

  return createRootField({
    name: operation + type.name,
    returnType: mutation,
    args: opArgs,
    resolve(parent, args, {conn}) {
      const clientMutationId = args.clientMutationId;
      const object = args[type.name];
      let queryArgs;
      if (getById) {
        queryArgs = [conn, type.name, args.id, object];
      } else {
        queryArgs = [conn, type.name, object];
      }
      return queries[operation](...queryArgs)
        .then((result) => ({
          clientMutationId,
          [type.name]: result,
        }));
    },
  });
}
