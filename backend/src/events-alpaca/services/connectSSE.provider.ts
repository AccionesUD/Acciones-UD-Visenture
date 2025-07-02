import { Controller, Injectable } from "@nestjs/common";
import { stream } from "fetch-event-stream";
import { env } from "process";
import { Observable } from "rxjs";

@Injectable()
export class ConnectSSEProvider {

    constructor() { }

    EventsBroker(url: string, headers: Record<string, any>): Observable<any> {
        return new Observable((suscribe) => {
            const controller = new AbortController();
            (async () => {
                try {
                    const events = await stream(url, { headers, signal: controller.signal })
                    suscribe.next('conexion SSE correcta')
                    for await (const ev of events) {
                        try {
                            if (ev.data) {
                                const data = JSON.parse(ev.data)
                                suscribe.next(data)
                            }
                        }
                        catch {
                            suscribe.next(ev.data)
                        }
                    }
                    suscribe.complete()


                } catch (error) {
                    suscribe.error(error)
                }
            })()
            return () => controller.abort()
        })
    }
}


