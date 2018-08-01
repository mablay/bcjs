# High throughput concept

Considering performance, executing multiple RPCs concurrently makes
sense. Yet, too many will jam io bounds or exceed server quota while
too few will yield suboptimal throughput.

As long as there are enough tasks enqueued, the RPC module will attempt
to maintain maximum concurrency while preserving result order.


## Enqueue
Enqueue new RPCs as tasks to be done.
Enqueuing returns a promise that will be resolved as soon as the data
for that specific task is available AND all previous tasks have been
processed (with or without error / timeout)
The queue size for enqueuing tasks may be as big as *heap size / task
size*.

## Execute
Although many many RPCs may be enqueued, only a specified amount of
RPCs are allowed to execute concurrently.
Execution results only become available for dequeuing after all
previous executions results also became available.

## Dequeue buffer
RPC results are withheld until they can be dequeued in order
of their initially enqueued requests.
